import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthVerificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthVerificationService.name);
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PendingSignup" (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PendingSignup_token_hash_idx"
      ON "PendingSignup" (token_hash)
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PendingPasswordReset" (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PendingPasswordReset_token_hash_idx"
      ON "PendingPasswordReset" (token_hash)
    `);

    await this.cleanupTemporaryAuthData();

    const configuredInterval = Number(process.env.TEMP_DATA_CLEANUP_INTERVAL_MS || 21_600_000);
    const cleanupInterval = Number.isFinite(configuredInterval)
      ? Math.max(configuredInterval, 60_000)
      : 21_600_000;

    this.cleanupTimer = setInterval(() => {
      void this.cleanupTemporaryAuthData().catch((error) => {
        const message = error instanceof Error ? error.message : 'unknown-error';
        this.logger.error(`Échec du nettoyage des données temporaires: ${message}`);
      });
    }, cleanupInterval);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private async cleanupTemporaryAuthData() {
    const configuredRetention = Number(process.env.CONSUMED_TOKEN_RETENTION_HOURS || 24);
    const retentionHours = Number.isFinite(configuredRetention)
      ? Math.max(configuredRetention, 0)
      : 24;
    const consumedBefore = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
    const now = new Date();

    const [pendingSignups, pendingPasswordResets] = await this.prisma.$transaction([
      this.prisma.pendingSignup.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { consumedAt: { lt: consumedBefore } },
          ],
        },
      }),
      this.prisma.pendingPasswordReset.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { consumedAt: { lt: consumedBefore } },
          ],
        },
      }),
    ]);

    const deletedCount = pendingSignups.count + pendingPasswordResets.count;
    if (deletedCount > 0) {
      this.logger.log(`Nettoyage des données temporaires terminé: ${deletedCount} entrée(s) supprimée(s).`);
    }
  }
}
