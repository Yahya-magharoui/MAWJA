const DEFAULT_DEV_AUTH_SECRET = 'mawja-dev-secret';
const DEFAULT_AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function requireEnv(name: string, value: string | undefined | null) {
  if (!value?.trim()) {
    throw new Error(`${name} doit être défini.`);
  }

  return value.trim();
}

function parsePositiveInteger(name: string, rawValue: string | undefined, fallback: number) {
  const value = rawValue?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} doit être un entier positif.`);
  }

  return Math.floor(parsed);
}

function assertUrl(
  name: string,
  rawValue: string | undefined | null,
  options?: { requireHttps?: boolean }
) {
  const value = requireEnv(name, rawValue);

  try {
    const url = new URL(value);
    if (!url.protocol || !url.host) {
      throw new Error('invalid-url');
    }
    if (options?.requireHttps && url.protocol !== 'https:') {
      throw new Error('invalid-protocol');
    }
  } catch {
    throw new Error(
      options?.requireHttps
        ? `${name} doit être une URL HTTPS valide.`
        : `${name} doit être une URL valide.`
    );
  }

  return value;
}

function assertAllowedOrigins(rawOrigins: string, options?: { requireHttps?: boolean }) {
  rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => {
      try {
        const url = new URL(origin);
        if (!url.protocol || !url.host) {
          throw new Error('invalid-origin');
        }
        if (options?.requireHttps && url.protocol !== 'https:') {
          throw new Error('invalid-protocol');
        }
      } catch {
        throw new Error(
          options?.requireHttps
            ? `ALLOWED_ORIGINS doit contenir uniquement des origines HTTPS valides: ${origin}`
            : `ALLOWED_ORIGINS contient une origine invalide: ${origin}`
        );
      }
    });
}

function normalizeOrigin(rawValue: string) {
  return new URL(rawValue).origin;
}

export function getAuthTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_DEV_AUTH_SECRET;
}

export function getAuthTokenTtlSeconds() {
  return parsePositiveInteger(
    'AUTH_TOKEN_TTL_SECONDS',
    process.env.AUTH_TOKEN_TTL_SECONDS,
    DEFAULT_AUTH_TOKEN_TTL_SECONDS
  );
}

export function assertRuntimeConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const authSecret = getAuthTokenSecret();
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.trim() || '';
  const webAppUrl = process.env.WEB_APP_URL || process.env.APP_WEB_URL;
  const emailVerificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED === 'true';
  const passwordResetEnabled = process.env.PASSWORD_RESET_EMAIL_ENABLED === 'true';
  const mailFeaturesEnabled = emailVerificationEnabled || passwordResetEnabled;

  requireEnv('DATABASE_URL', process.env.DATABASE_URL);
  parsePositiveInteger('PORT', process.env.PORT, 3000);
  parsePositiveInteger(
    'API_RATE_LIMIT_WINDOW_MS',
    process.env.API_RATE_LIMIT_WINDOW_MS,
    60_000
  );
  parsePositiveInteger('API_RATE_LIMIT_MAX', process.env.API_RATE_LIMIT_MAX, 120);
  parsePositiveInteger(
    'AUTH_RATE_LIMIT_WINDOW_MS',
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60_000
  );
  parsePositiveInteger('AUTH_RATE_LIMIT_MAX', process.env.AUTH_RATE_LIMIT_MAX, 30);
  parsePositiveInteger(
    'EMAIL_VERIFICATION_EXPIRY_HOURS',
    process.env.EMAIL_VERIFICATION_EXPIRY_HOURS,
    24
  );
  parsePositiveInteger(
    'PASSWORD_RESET_EXPIRY_HOURS',
    process.env.PASSWORD_RESET_EXPIRY_HOURS,
    2
  );

  if (isProduction && authSecret === DEFAULT_DEV_AUTH_SECRET) {
    throw new Error('AUTH_TOKEN_SECRET doit être défini en production.');
  }

  if (isProduction) {
    requireEnv('ALLOWED_ORIGINS', allowedOrigins);
    assertAllowedOrigins(allowedOrigins, { requireHttps: true });
    assertUrl('WEB_APP_URL', webAppUrl, { requireHttps: true });

    const webAppOrigin = normalizeOrigin(webAppUrl!);
    const normalizedAllowedOrigins = allowedOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeOrigin);

    if (!normalizedAllowedOrigins.includes(webAppOrigin)) {
      throw new Error(
        'ALLOWED_ORIGINS doit contenir l’origine de WEB_APP_URL en production.'
      );
    }
  } else if (allowedOrigins) {
    assertAllowedOrigins(allowedOrigins);
  }

  if (mailFeaturesEnabled) {
    assertUrl('WEB_APP_URL', webAppUrl, { requireHttps: isProduction });
    requireEnv('RESEND_API_KEY', process.env.RESEND_API_KEY);
    requireEnv('RESEND_FROM_EMAIL', process.env.RESEND_FROM_EMAIL);
  }
}
