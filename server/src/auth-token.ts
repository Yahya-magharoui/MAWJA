import { createHmac, timingSafeEqual } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

type TokenPayload = {
  sub: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
};

type LegacyAuthenticatedUser = {
  id: number;
  email: string;
  role: string | null;
  password: string | null;
  createdAt: Date;
  patientProfileId: number | null;
  doctorProfileId: number | null;
};

type AuthenticatedUser = {
  id: number;
  email: string;
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

function getSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'mawja-dev-secret';
}

export function signAuthToken(payload: TokenPayload) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${header}.${body}`;
  const signature = createHmac('sha256', getSecret()).update(unsignedToken).digest();
  return `${unsignedToken}.${toBase64Url(signature)}`;
}

export function verifyAuthToken(token: string): TokenPayload {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) {
    throw new UnauthorizedException('Token invalide.');
  }

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = createHmac('sha256', getSecret()).update(unsignedToken).digest();
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
    if (!parsed.sub || !parsed.email) {
      throw new Error('payload');
    }
    return {
      sub: parsed.sub,
      email: parsed.email,
      role: parsed.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    };
  } catch {
    throw new UnauthorizedException('Token invalide.');
  }
}

export function extractBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Authentification requise.');
  }

  return authorization.slice('Bearer '.length).trim();
}

export async function requireAuthenticatedUser(prisma: PrismaService, authorization?: string) {
  const token = extractBearerToken(authorization);
  const payload = verifyAuthToken(token);
  const userId = Number(payload.sub);

  if (!Number.isFinite(userId)) {
    throw new UnauthorizedException('Utilisateur introuvable.');
  }

  const rows = await prisma.$queryRaw<LegacyAuthenticatedUser[]>`
    SELECT id, email, role, password, "createdAt", "patientProfileId", "doctorProfileId"
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;
  const user = rows[0] ?? null;

  if (!user) {
    throw new UnauthorizedException('Utilisateur introuvable.');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    passwordHash: user.password,
    createdAt: user.createdAt,
    patientProfileId: user.patientProfileId,
    doctorProfileId: user.doctorProfileId,
  } satisfies AuthenticatedUser;
}
