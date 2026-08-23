import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const REDIS_RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
`;

function createRateLimitRedisClient(url: string) {
  return createClient({
    url,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: false,
    },
  });
}

type RateLimitRedisClient = ReturnType<typeof createRateLimitRedisClient>;

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly localStore = new Map<string, RateLimitEntry>();
  private localOperations = 0;
  private redis: RateLimitRedisClient | null = null;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL?.trim();

    if (!redisUrl) {
      this.logger.warn('REDIS_URL absente : limitation des requêtes en mémoire locale.');
      return;
    }

    const redis = createRateLimitRedisClient(redisUrl);

    redis.on('error', (error) => {
      this.logger.error(`Redis indisponible : ${error instanceof Error ? error.message : error}`);
    });

    try {
      await redis.connect();
      this.redis = redis;
      this.logger.log('Limitation des requêtes partagée via Redis.');
    } catch (error) {
      this.logger.error(
        `Connexion Redis impossible, repli local activé : ${
          error instanceof Error ? error.message : error
        }`
      );
      redis.destroy();
    }
  }

  async onModuleDestroy() {
    if (this.redis?.isOpen) {
      await this.redis.close();
    }
  }

  async consume(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    if (this.redis?.isReady) {
      try {
        const result = (await this.redis.eval(REDIS_RATE_LIMIT_SCRIPT, {
          keys: [`kalymap:rate-limit:${key}`],
          arguments: [String(windowMs)],
        })) as [number, number];
        const [count, ttlMs] = result.map(Number);

        return {
          allowed: count <= max,
          retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1_000)),
        };
      } catch (error) {
        this.logger.error(
          `Erreur Redis pendant la limitation, repli local : ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }

    return this.consumeLocally(key, windowMs, max);
  }

  private consumeLocally(key: string, windowMs: number, max: number): RateLimitResult {
    const now = Date.now();
    this.localOperations += 1;

    if (this.localOperations % 1_000 === 0) {
      for (const [storedKey, entry] of this.localStore.entries()) {
        if (entry.resetAt <= now) {
          this.localStore.delete(storedKey);
        }
      }
    }

    const existingEntry = this.localStore.get(key);

    if (!existingEntry || existingEntry.resetAt <= now) {
      this.localStore.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1_000) };
    }

    existingEntry.count += 1;

    return {
      allowed: existingEntry.count <= max,
      retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1_000)),
    };
  }
}
