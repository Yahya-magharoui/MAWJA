import type { NextFunction, Request, Response } from 'express';
import type { RateLimitService } from './rate-limit.service';

type RateLimitOptions = {
  key: string;
  windowMs: number;
  max: number;
  paths?: string[];
};

function getClientIp(request: Request) {
  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function createRateLimitMiddleware(options: RateLimitOptions, store: RateLimitService) {
  return async (request: Request, response: Response, next: NextFunction) => {
    if (request.method === 'OPTIONS') {
      next();
      return;
    }

    if (options.paths && !options.paths.includes(request.path)) {
      next();
      return;
    }

    const identifier = `${options.key}:${getClientIp(request)}`;
    const result = await store.consume(identifier, options.windowMs, options.max);

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfterSeconds);
      response.status(429).json({
        statusCode: 429,
        message: 'Trop de requêtes. Réessaie dans quelques instants.',
      });
      return;
    }

    next();
  };
}

export function securityHeadersMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  if (request.secure || request.headers['x-forwarded-proto'] === 'https') {
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
}

export function authNoStoreMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  next();
}

export function parseAllowedOrigins() {
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  const webAppUrl = process.env.WEB_APP_URL?.trim();
  const developmentOrigins =
    process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3001', 'http://127.0.0.1:3001']
      : [];

  if (!rawOrigins || rawOrigins.trim().length === 0) {
    const fallbackOrigins = [webAppUrl, ...developmentOrigins]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => origin.trim())
      .filter(Boolean);

    return Array.from(new Set(fallbackOrigins));
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .concat(webAppUrl ? [webAppUrl] : [], developmentOrigins)
    .filter(Boolean)
    .filter((origin, index, origins) => origins.indexOf(origin) === index);
}

export function createCorsOriginChecker(allowedOrigins: string[]) {
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origine non autorisée: ${origin}`));
  };
}
