import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SafePlacesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SafePlace" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        answers JSONB NOT NULL,
        "patientId" INTEGER NOT NULL REFERENCES "Patient"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SafePlace_patientId_createdAt_idx"
      ON "SafePlace" ("patientId", "createdAt")
    `);
  }
}
