import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { json } from 'express';
import {
  authNoStoreMiddleware,
  createCorsOriginChecker,
  createRateLimitMiddleware,
  parseAllowedOrigins,
  securityHeadersMiddleware,
} from './security';
import { assertRuntimeConfig } from './runtime-config';

async function bootstrap() {
  assertRuntimeConfig();
  const app = await NestFactory.create(AppModule, { cors: false });
  const expressApp = app.getHttpAdapter().getInstance();
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = parseAllowedOrigins();
  const apiRateLimitWindowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000);
  const apiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 120);
  const authRateLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60_000);
  const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 30);

  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : 0);
  app.enableCors({
    origin: createCorsOriginChecker(allowedOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  });
  app.use(securityHeadersMiddleware);
  app.use(json({ limit: '1mb' }));
  app.use(
    createRateLimitMiddleware({
      key: 'api',
      windowMs: Number.isFinite(apiRateLimitWindowMs) ? apiRateLimitWindowMs : 60_000,
      max: Number.isFinite(apiRateLimitMax) ? apiRateLimitMax : 120,
    })
  );
  app.use(
    '/api/auth',
    authNoStoreMiddleware,
    createRateLimitMiddleware({
      key: 'auth',
      windowMs: Number.isFinite(authRateLimitWindowMs) ? authRateLimitWindowMs : 15 * 60_000,
      max: Number.isFinite(authRateLimitMax) ? authRateLimitMax : 30,
    })
  );
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(
    `API running on ${isProduction ? 'production' : 'local'} port ${port} with ${allowedOrigins.length} allowed origin(s).`
  );
}
bootstrap();
