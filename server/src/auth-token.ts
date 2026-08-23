import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getAuthTokenSecret, getAuthTokenTtlSeconds } from './runtime-config';

export const LEGACY_AUTH_COOKIE_NAME = 'mawja_auth';
export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? `__Secure-${LEGACY_AUTH_COOKIE_NAME}`
    : LEGACY_AUTH_COOKIE_NAME;

type TokenPayload = {
  sub: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
  sid: string;
  iat?: number;
  exp?: number;
};

type LegacyAuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: string | null;
  password: string | null;
  createdAt: Date;
  patientProfileId: number | null;
  doctorProfileId: number | null;
};

type AuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'PATIENT' | 'DOCTOR';
  passwordHash: string | null;
  createdAt: Date;
  patientProfileId: number | null;
  doctorProfileId: number | null;
};

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signAuthToken(payload: TokenPayload) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + getAuthTokenTtlSeconds(),
  };
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(tokenPayload));
  const unsignedToken = `${header}.${body}`;
  const signature = createHmac('sha256', getAuthTokenSecret()).update(unsignedToken).digest();
  return `${unsignedToken}.${toBase64Url(signature)}`;
}

export function verifyAuthToken(token: string): TokenPayload {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) {
    throw new UnauthorizedException('Token invalide.');
  }

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = createHmac('sha256', getAuthTokenSecret()).update(unsignedToken).digest();
  const receivedSignature = Buffer.from(
    signature.replace(/-/g, '+').replace(/_/g, '/').padEnd(signature.length + ((4 - (signature.length % 4)) % 4), '='),
    'base64'
  );

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw new UnauthorizedException('Token invalide.');
  }

  try {
    const parsed = JSON.parse(fromBase64Url(body)) as Partial<TokenPayload>;
    if (!parsed.sub || !parsed.email || !parsed.sid) {
      throw new Error('payload');
    }

    if (typeof parsed.exp === 'number' && parsed.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Session expirée.');
    }

    return {
      sub: parsed.sub,
      email: parsed.email,
      role: parsed.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      sid: parsed.sid,
      iat: typeof parsed.iat === 'number' ? parsed.iat : undefined,
      exp: typeof parsed.exp === 'number' ? parsed.exp : undefined,
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }

    throw new UnauthorizedException('Token invalide.');
  }
}

export function hashSessionId(sessionId: string) {
  return createHash('sha256').update(sessionId).digest('hex');
}

export function extractBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Authentification requise.');
  }

  return authorization.slice('Bearer '.length).trim();
}

export function extractCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader?.trim()) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();
    if (name !== key) {
      continue;
    }

    const value = part.slice(separatorIndex + 1).trim();
    if (!value) {
      return null;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export function extractAuthToken(authorization?: string, cookieHeader?: string) {
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const cookieToken = extractCookieValue(cookieHeader, AUTH_COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }

  if (AUTH_COOKIE_NAME !== LEGACY_AUTH_COOKIE_NAME) {
    const legacyCookieToken = extractCookieValue(cookieHeader, LEGACY_AUTH_COOKIE_NAME);
    if (legacyCookieToken) {
      return legacyCookieToken;
    }
  }

  throw new UnauthorizedException('Authentification requise.');
}

export async function requireAuthenticatedUser(
  prisma: PrismaService,
  authorization?: string,
  cookieHeader?: string
) {
  const token = extractAuthToken(authorization, cookieHeader);
  const payload = verifyAuthToken(token);
  const userId = Number(payload.sub);

  if (!Number.isFinite(userId)) {
    throw new UnauthorizedException('Utilisateur introuvable.');
  }

  const sessionHash = hashSessionId(payload.sid);
  const rows = await prisma.$queryRaw<LegacyAuthenticatedUser[]>`
    SELECT u.id, u.email, u.name, u.role, u.password, u."createdAt", u."patientProfileId", u."doctorProfileId"
    FROM "User" u
    INNER JOIN "AuthSession" s ON s.user_id = u.id
    WHERE u.id = ${userId}
      AND s.token_hash = ${sessionHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  const user = rows[0] ?? null;

  if (!user) {
    throw new UnauthorizedException('Utilisateur introuvable.');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    passwordHash: user.password,
    createdAt: user.createdAt,
    patientProfileId: user.patientProfileId,
    doctorProfileId: user.doctorProfileId,
  } satisfies AuthenticatedUser;
}

export async function revokeAuthenticatedSession(
  prisma: PrismaService,
  authorization?: string,
  cookieHeader?: string
) {
  const token = extractAuthToken(authorization, cookieHeader);
  const payload = verifyAuthToken(token);
  const sessionHash = hashSessionId(payload.sid);

  await prisma.$executeRaw`
    UPDATE "AuthSession"
    SET revoked_at = NOW()
    WHERE token_hash = ${sessionHash}
      AND revoked_at IS NULL
  `;
}
