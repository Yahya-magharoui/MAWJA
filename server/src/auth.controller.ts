import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AUTH_COOKIE_NAME,
  hashSessionId,
  requireAuthenticatedUser,
  revokeAuthenticatedSession,
  signAuthToken,
} from './auth-token';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { validateInput } from './validation';
import type { Response } from 'express';
import { getAuthTokenTtlSeconds } from './runtime-config';

type LegacyUserRow = {
  id: number;
  email: string;
  password: string | null;
  name: string | null;
  role: string | null;
  createdAt: Date;
  patientProfileId: number | null;
  doctorProfileId: number | null;
};

type LegacyPatientRow = {
  id: number;
};

type LegacyDoctorRow = {
  id: number;
};

type PendingSignupRow = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};

type PendingPasswordResetRow = {
  id: number;
  email: string;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};

type SerializableUser = Pick<
  LegacyUserRow,
  'id' | 'email' | 'name' | 'role' | 'createdAt' | 'patientProfileId' | 'doctorProfileId'
>;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '12345678910',
  '123456789123456',
  'azerty123456',
  'azertyuiop',
  'password',
  'password123',
  'password1234',
  'qwerty123',
  'qwertyuiop',
  'motdepasse',
  'motdepasse123',
  'admin123456',
  'welcome123',
  'letmein123',
  'bonjour123',
]);

const authBodySchema = z.object({
  email: z.string().trim().max(254),
  password: z.string().max(MAX_PASSWORD_LENGTH),
  confirmPassword: z.string().max(MAX_PASSWORD_LENGTH).optional(),
  role: z.enum(['PATIENT', 'DOCTOR']).optional(),
});

const emailCheckBodySchema = z.object({
  email: z.string().trim().max(254),
});

const verifyEmailBodySchema = z.object({
  token: z.string().trim().min(1).optional(),
});

const forgotPasswordBodySchema = z.object({
  email: z.string().trim().max(254),
});

const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().max(MAX_PASSWORD_LENGTH),
  confirmPassword: z.string().max(MAX_PASSWORD_LENGTH),
});

type AuthBody = z.infer<typeof authBodySchema>;
type EmailCheckBody = z.infer<typeof emailCheckBodySchema>;
type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

const APP_BRAND_NAME = 'Kalymap';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private prisma: PrismaService) {}

  private usesSecureCookies() {
    return process.env.NODE_ENV === 'production';
  }

  private getAuthCookieOptions() {
    const secure = this.usesSecureCookies();

    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: getAuthTokenTtlSeconds() * 1000,
    };
  }

  private writeAuthCookie(response: Response, accessToken: string) {
    response.cookie(AUTH_COOKIE_NAME, accessToken, this.getAuthCookieOptions());
  }

  private clearAuthCookie(response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.usesSecureCookies(),
      sameSite: 'lax' as const,
      path: '/',
    });
  }

  private emailVerificationEnabled() {
    return process.env.EMAIL_VERIFICATION_ENABLED === 'true';
  }

  private getVerificationExpiryDate() {
    const hours = Number(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || 24);
    return new Date(Date.now() + Math.max(hours, 1) * 60 * 60 * 1000);
  }

  private passwordResetEnabled() {
    return (
      process.env.PASSWORD_RESET_EMAIL_ENABLED === 'true' ||
      this.emailVerificationEnabled()
    );
  }

  private getPasswordResetExpiryDate() {
    const hours = Number(process.env.PASSWORD_RESET_EXPIRY_HOURS || 2);
    return new Date(Date.now() + Math.max(hours, 1) * 60 * 60 * 1000);
  }

  private getWebBaseUrl() {
    return (
      process.env.WEB_APP_URL ||
      process.env.APP_WEB_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');
  }

  private hashVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildVerificationLink(token: string) {
    const baseUrl = this.getWebBaseUrl();
    return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  }

  private buildPasswordResetLink(token: string) {
    const baseUrl = this.getWebBaseUrl();
    return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private async createPendingSignup(email: string, passwordHash: string, role: 'PATIENT' | 'DOCTOR') {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashVerificationToken(token);
    const expiresAt = this.getVerificationExpiryDate();

    await this.prisma.$executeRaw`
      DELETE FROM "PendingSignup"
      WHERE email = ${email}
    `;

    const rows = await this.prisma.$queryRaw<PendingSignupRow[]>`
      INSERT INTO "PendingSignup" (email, password_hash, role, token_hash, expires_at)
      VALUES (${email}, ${passwordHash}, ${role}, ${tokenHash}, ${expiresAt})
      RETURNING id, email, password_hash, role, token_hash, expires_at, consumed_at, created_at
    `;

    return {
      pendingSignup: rows[0] ?? null,
      token,
      expiresAt,
    };
  }

  private async findPendingSignupByToken(token: string) {
    const tokenHash = this.hashVerificationToken(token);
    const rows = await this.prisma.$queryRaw<PendingSignupRow[]>`
      SELECT id, email, password_hash, role, token_hash, expires_at, consumed_at, created_at
      FROM "PendingSignup"
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private async markPendingSignupConsumed(id: number) {
    await this.prisma.$executeRaw`
      UPDATE "PendingSignup"
      SET consumed_at = NOW()
      WHERE id = ${id}
    `;
  }

  private async createPendingPasswordReset(email: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashVerificationToken(token);
    const expiresAt = this.getPasswordResetExpiryDate();

    await this.prisma.$executeRaw`
      DELETE FROM "PendingPasswordReset"
      WHERE email = ${email}
    `;

    const rows = await this.prisma.$queryRaw<PendingPasswordResetRow[]>`
      INSERT INTO "PendingPasswordReset" (email, token_hash, expires_at)
      VALUES (${email}, ${tokenHash}, ${expiresAt})
      RETURNING id, email, token_hash, expires_at, consumed_at, created_at
    `;

    return {
      pendingPasswordReset: rows[0] ?? null,
      token,
      expiresAt,
    };
  }

  private async findPendingPasswordResetByToken(token: string) {
    const tokenHash = this.hashVerificationToken(token);
    const rows = await this.prisma.$queryRaw<PendingPasswordResetRow[]>`
      SELECT id, email, token_hash, expires_at, consumed_at, created_at
      FROM "PendingPasswordReset"
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private async markPendingPasswordResetConsumed(id: number) {
    await this.prisma.$executeRaw`
      UPDATE "PendingPasswordReset"
      SET consumed_at = NOW()
      WHERE id = ${id}
    `;
  }

  private async sendResendEmail(payload: {
    to: string;
    subject: string;
    html: string;
    missingConfigMessage: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      throw new HttpException(payload.missingConfigMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let response: globalThis.Response;

    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown-error';
      this.logger.error(`Échec de connexion au service d'e-mail: ${message}`);
      throw new HttpException(
        "Le service d'envoi d'e-mail est temporairement indisponible.",
        HttpStatus.BAD_GATEWAY
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(
        `Échec d'envoi d'e-mail Resend (${response.status} ${response.statusText})${
          errorBody ? `: ${errorBody}` : ''
        }`
      );
      throw new HttpException(
        "L'e-mail n'a pas pu être envoyé pour le moment. Réessaie plus tard.",
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  private async sendVerificationEmail(email: string, token: string) {
    const verificationLink = this.buildVerificationLink(token);
    await this.sendResendEmail({
      to: email,
      subject: `Confirme ton compte ${APP_BRAND_NAME}`,
      missingConfigMessage: "La configuration de l'e-mail de confirmation est incomplète.",
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2 style="margin-bottom: 16px;">Bienvenue sur ${APP_BRAND_NAME}</h2>
            <p>Confirme ton adresse e-mail pour finaliser la création de ton compte.</p>
            <p style="margin: 24px 0;">
              <a
                href="${verificationLink}"
                style="display:inline-block;padding:12px 18px;border-radius:10px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;"
              >
                Confirmer mon adresse e-mail
              </a>
            </p>
            <p>Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>Ce lien expirera dans ${process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || '24'} heures.</p>
          </div>
        `,
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = this.buildPasswordResetLink(token);
    await this.sendResendEmail({
      to: email,
      subject: `Réinitialise ton mot de passe ${APP_BRAND_NAME}`,
      missingConfigMessage: "La configuration de l'e-mail de réinitialisation est incomplète.",
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2 style="margin-bottom: 16px;">Réinitialisation du mot de passe</h2>
            <p>Tu as demandé à définir un nouveau mot de passe pour ton compte ${APP_BRAND_NAME}.</p>
            <p style="margin: 24px 0;">
              <a
                href="${resetLink}"
                style="display:inline-block;padding:12px 18px;border-radius:10px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;"
              >
                Définir un nouveau mot de passe
              </a>
            </p>
            <p>Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>Ce lien expirera dans ${process.env.PASSWORD_RESET_EXPIRY_HOURS || '2'} heures.</p>
          </div>
        `,
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private validatePassword(password: string, email: string) {
    const normalizedPassword = password.trim();
    const normalizedEmail = this.normalizeEmail(email);
    const localPart = normalizedEmail.split('@')[0] || '';
    const loweredPassword = normalizedPassword.toLowerCase();

    if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
      return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    }

    if (normalizedPassword.length > MAX_PASSWORD_LENGTH) {
      return `Le mot de passe doit contenir au maximum ${MAX_PASSWORD_LENGTH} caractères.`;
    }

    if (!/[A-ZÀ-ÖØ-Ý]/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins une majuscule.';
    }

    if (!/\d/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins un chiffre.';
    }

    if (!/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial.';
    }

    if (COMMON_PASSWORDS.has(loweredPassword)) {
      return 'Choisis un mot de passe moins courant.';
    }

    if (localPart && loweredPassword.includes(localPart)) {
      return "Le mot de passe ne doit pas contenir ton adresse e-mail.";
    }

    if (loweredPassword.includes('kalymap')) {
      return "Le mot de passe ne doit pas contenir le nom de l'application.";
    }

    if (/^(.)\1{7,}$/.test(normalizedPassword)) {
      return 'Le mot de passe est trop prévisible.';
    }

    return null;
  }

  private async findLegacyUserByEmail(email: string) {
    const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
      SELECT id, email, password, name, role, "createdAt", "patientProfileId", "doctorProfileId"
      FROM "User"
      WHERE email = ${email}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private async ensurePatientProfile(userId: number) {
    const existingRows = await this.prisma.$queryRaw<LegacyPatientRow[]>`
      SELECT id
      FROM "Patient"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const existing = existingRows[0];
    if (existing) return existing.id;

    const createdRows = await this.prisma.$queryRaw<LegacyPatientRow[]>`
      INSERT INTO "Patient" ("userId")
      VALUES (${userId})
      RETURNING id
    `;

    return createdRows[0]?.id ?? null;
  }

  private async ensureDoctorProfile(userId: number) {
    const existingRows = await this.prisma.$queryRaw<LegacyDoctorRow[]>`
      SELECT id
      FROM "Doctor"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const existing = existingRows[0];
    if (existing) return existing.id;

    const doctorCode = `DOC-${userId}-${Date.now()}`;
    const createdRows = await this.prisma.$queryRaw<LegacyDoctorRow[]>`
      INSERT INTO "Doctor" ("userId", "doctor_code")
      VALUES (${userId}, ${doctorCode})
      RETURNING id
    `;

    return createdRows[0]?.id ?? null;
  }

  private async syncUserProfiles(user: LegacyUserRow) {
    let patientProfileId = user.patientProfileId;
    let doctorProfileId = user.doctorProfileId;

    if (user.role === 'DOCTOR') {
      doctorProfileId = doctorProfileId ?? (await this.ensureDoctorProfile(user.id));
    } else {
      patientProfileId = patientProfileId ?? (await this.ensurePatientProfile(user.id));
    }

    if (patientProfileId !== user.patientProfileId || doctorProfileId !== user.doctorProfileId) {
      const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
        UPDATE "User"
        SET "patientProfileId" = ${patientProfileId},
            "doctorProfileId" = ${doctorProfileId}
        WHERE id = ${user.id}
        RETURNING id, email, password, name, role, "createdAt", "patientProfileId", "doctorProfileId"
      `;

      return rows[0] ?? {
        ...user,
        patientProfileId,
        doctorProfileId,
      };
    }

    return user;
  }

  private serializeUser(user: SerializableUser) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      createdAt: user.createdAt,
      patientProfileId: user.patientProfileId,
      doctorProfileId: user.doctorProfileId,
    };
  }

  private async issueAuthenticatedSession(user: LegacyUserRow, response?: Response) {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + getAuthTokenTtlSeconds() * 1000);

    await this.prisma.$executeRaw`
      INSERT INTO "AuthSession" (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${hashSessionId(sessionId)}, ${expiresAt})
    `;

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      sid: sessionId,
    });

    if (response) {
      this.writeAuthCookie(response, accessToken);
    }

    return {
      ok: true,
      user: this.serializeUser(user),
    };
  }

  private async createLegacyUser(email: string, passwordHash: string, role: 'PATIENT' | 'DOCTOR') {
    const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
      INSERT INTO "User" (email, password, role)
      VALUES (${email}, ${passwordHash}, CAST(${role} AS "Role"))
      RETURNING id, email, password, name, role, "createdAt", "patientProfileId", "doctorProfileId"
    `;

    const createdUser = rows[0];
    if (!createdUser) {
      throw new HttpException('Création du compte impossible.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return this.syncUserProfiles(createdUser);
  }

  private async registerUser(body: AuthBody, response?: Response) {
    const email = this.normalizeEmail(body.email || '');
    const password = body.password || '';
    const confirmPassword = body.confirmPassword ?? '';
    const role = body.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    if (!email || !this.isValidEmail(email)) {
      throw new HttpException('Adresse e-mail invalide.', HttpStatus.BAD_REQUEST);
    }

    const passwordValidationMessage = this.validatePassword(password, email);
    if (passwordValidationMessage) {
      throw new HttpException(passwordValidationMessage, HttpStatus.BAD_REQUEST);
    }

    if (body.confirmPassword !== undefined && password !== confirmPassword) {
      throw new HttpException('Les mots de passe ne correspondent pas.', HttpStatus.BAD_REQUEST);
    }

    const exists = await this.findLegacyUserByEmail(email);
    if (exists) {
      throw new HttpException('Email déjà utilisé', HttpStatus.CONFLICT);
    }

    const hash = await bcrypt.hash(password, 10);

    if (this.emailVerificationEnabled()) {
      const { pendingSignup, token } = await this.createPendingSignup(email, hash, role);

      if (!pendingSignup) {
        throw new HttpException("Préparation de l'inscription impossible.", HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await this.sendVerificationEmail(email, token);

      return {
        ok: true,
        requiresEmailVerification: true,
        email,
        message: "Un e-mail de confirmation vient d'être envoyé.",
      };
    }

    const user = await this.createLegacyUser(email, hash, role);

    return this.issueAuthenticatedSession(user, response);
  }

  @Post('signup')
  async signup(@Body() body: AuthBody, @Res({ passthrough: true }) response: Response) {
    const validatedBody: AuthBody = validateInput(authBodySchema, body);
    return this.registerUser(validatedBody, response);
  }

  @Post('register')
  async register(@Body() body: AuthBody, @Res({ passthrough: true }) response: Response) {
    const validatedBody: AuthBody = validateInput(authBodySchema, body);
    return this.registerUser(validatedBody, response);
  }

  @Post('check-email')
  async checkEmail(@Body() body: EmailCheckBody) {
    const validatedBody = validateInput(emailCheckBodySchema, body);
    const email = this.normalizeEmail(validatedBody.email || '');

    if (!email || !this.isValidEmail(email)) {
      return {
        ok: false,
        available: false,
        exists: false,
        normalizedEmail: email,
        message: 'Adresse e-mail invalide.',
      };
    }

    const existingUser = await this.findLegacyUserByEmail(email);

    return {
      ok: true,
      available: !existingUser,
      exists: Boolean(existingUser),
      normalizedEmail: email,
      message: existingUser ? 'Cette adresse e-mail est déjà utilisée.' : 'Adresse e-mail disponible.',
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailBody, @Res({ passthrough: true }) response: Response) {
    const validatedBody = validateInput(verifyEmailBodySchema, body);
    const token = validatedBody.token?.trim();

    if (!token) {
      throw new HttpException('Lien de confirmation invalide.', HttpStatus.BAD_REQUEST);
    }

    const pendingSignup = await this.findPendingSignupByToken(token);
    if (!pendingSignup) {
      throw new HttpException('Lien de confirmation invalide ou déjà utilisé.', HttpStatus.BAD_REQUEST);
    }

    if (pendingSignup.consumed_at) {
      throw new HttpException('Ce lien de confirmation a déjà été utilisé.', HttpStatus.BAD_REQUEST);
    }

    if (pendingSignup.expires_at.getTime() < Date.now()) {
      throw new HttpException('Ce lien de confirmation a expiré.', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.findLegacyUserByEmail(pendingSignup.email);
    if (existingUser) {
      await this.markPendingSignupConsumed(pendingSignup.id);
      throw new HttpException('Cette adresse e-mail est déjà utilisée.', HttpStatus.CONFLICT);
    }

    const user = await this.createLegacyUser(
      pendingSignup.email,
      pendingSignup.password_hash,
      pendingSignup.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT'
    );

    await this.markPendingSignupConsumed(pendingSignup.id);

    return {
      ...(await this.issueAuthenticatedSession(user, response)),
      message: 'Adresse e-mail confirmée.',
    };
  }

  @Get('verify-email')
  async verifyEmailFromQuery(
    @Query('token') token: string | undefined,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.verifyEmail({ token }, response);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordBody) {
    const validatedBody = validateInput(forgotPasswordBodySchema, body);
    const email = this.normalizeEmail(validatedBody.email || '');

    if (!email || !this.isValidEmail(email)) {
      return {
        ok: true,
        message:
          "Si un compte existe pour cette adresse, un lien de réinitialisation va être envoyé.",
      };
    }

    const existingUser = await this.findLegacyUserByEmail(email);
    if (!existingUser) {
      return {
        ok: true,
        message:
          "Si un compte existe pour cette adresse, un lien de réinitialisation va être envoyé.",
      };
    }

    const { pendingPasswordReset, token } = await this.createPendingPasswordReset(email);

    if (!pendingPasswordReset) {
      throw new HttpException(
        'Préparation de la réinitialisation impossible.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    if (this.passwordResetEnabled()) {
      await this.sendPasswordResetEmail(email, token);

      return {
        ok: true,
        message:
          "Si un compte existe pour cette adresse, un lien de réinitialisation va être envoyé.",
      };
    }

    const debugResetLink =
      process.env.NODE_ENV !== 'production' ? this.buildPasswordResetLink(token) : undefined;

    return {
      ok: true,
      message:
        "Si un compte existe pour cette adresse, un lien de réinitialisation va être envoyé.",
      debugResetLink,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordBody) {
    const validatedBody = validateInput(resetPasswordBodySchema, body);
    const token = validatedBody.token.trim();
    const password = validatedBody.password || '';
    const confirmPassword = validatedBody.confirmPassword || '';

    if (password !== confirmPassword) {
      throw new HttpException('Les mots de passe ne correspondent pas.', HttpStatus.BAD_REQUEST);
    }

    const pendingPasswordReset = await this.findPendingPasswordResetByToken(token);
    if (!pendingPasswordReset) {
      throw new HttpException('Lien de réinitialisation invalide ou déjà utilisé.', HttpStatus.BAD_REQUEST);
    }

    if (pendingPasswordReset.consumed_at) {
      throw new HttpException('Ce lien de réinitialisation a déjà été utilisé.', HttpStatus.BAD_REQUEST);
    }

    if (pendingPasswordReset.expires_at.getTime() < Date.now()) {
      throw new HttpException('Ce lien de réinitialisation a expiré.', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.findLegacyUserByEmail(this.normalizeEmail(pendingPasswordReset.email));
    if (!existingUser) {
      await this.markPendingPasswordResetConsumed(pendingPasswordReset.id);
      throw new HttpException('Utilisateur introuvable.', HttpStatus.NOT_FOUND);
    }

    const passwordValidationMessage = this.validatePassword(password, existingUser.email);
    if (passwordValidationMessage) {
      throw new HttpException(passwordValidationMessage, HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "User"
        SET password = ${passwordHash}
        WHERE id = ${existingUser.id}
      `;

      await tx.$executeRaw`
        UPDATE "AuthSession"
        SET revoked_at = NOW()
        WHERE user_id = ${existingUser.id}
          AND revoked_at IS NULL
      `;

      await tx.$executeRaw`
        UPDATE "PendingPasswordReset"
        SET consumed_at = NOW()
        WHERE id = ${pendingPasswordReset.id}
      `;
    });

    return {
      ok: true,
      message: 'Mot de passe réinitialisé avec succès.',
    };
  }

  @Post('login')
  async login(@Body() body: AuthBody, @Res({ passthrough: true }) response: Response) {
    const validatedBody = validateInput(authBodySchema.omit({ confirmPassword: true, role: true }), body);
    const email = this.normalizeEmail(validatedBody.email || '');
    const password = validatedBody.password || '';

    if (!email || !password) {
      throw new HttpException('Email ou mot de passe invalide.', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.findLegacyUserByEmail(email);

    if (!existingUser?.password) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatches) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.syncUserProfiles(existingUser);
    return this.issueAuthenticatedSession(user, response);
  }

  @Get('me')
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    return {
      ok: true,
      user: this.serializeUser(user),
    };
  }

  @Get('account/export')
  async exportAccountData(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);

    if (user.role !== 'PATIENT') {
      throw new HttpException(
        "L'export n'est pas disponible pour ce type de compte.",
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
      include: {
        histories: {
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'asc' },
        },
        goals: {
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
        },
        favorites: {
          orderBy: { createdAt: 'asc' },
          include: { exercise: true },
        },
        safePlaces: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const exportedAt = new Date();
    const dateSuffix = exportedAt.toISOString().slice(0, 10);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="kalymap-donnees-${dateSuffix}.json"`,
    );

    return {
      formatVersion: 1,
      exportedAt: exportedAt.toISOString(),
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'PATIENT',
        createdAt: user.createdAt,
      },
      profile: patient
        ? {
            id: patient.id,
            currentSituation: patient.currentSituation,
            createdAt: patient.createdAt,
          }
        : null,
      histories: patient?.histories ?? [],
      activities: patient?.activityLogs ?? [],
      goals: patient?.goals ?? [],
      notes: patient?.notes ?? [],
      favorites: patient?.favorites ?? [],
      safePlaces: patient?.safePlaces ?? [],
    };
  }

  @Post('logout')
  async logout(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      await revokeAuthenticatedSession(this.prisma, authorization, cookieHeader);
    } catch {
      // La suppression locale du cookie reste possible si la session est déjà invalide.
    }
    this.clearAuthCookie(response);
    return {
      ok: true,
    };
  }

  @Delete('account')
  async deleteAccount(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);

    if (user.role === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      });

      if (doctor) {
        const assignedPatients = await this.prisma.patient.count({
          where: { doctorId: doctor.id },
        });

        if (assignedPatients > 0) {
          throw new HttpException(
            'Impossible de supprimer ce compte tant que des patients y sont rattachés.',
            HttpStatus.CONFLICT,
          );
        }
      }

      await this.prisma.$transaction(async (tx) => {
        if (doctor) {
          await tx.user.update({
            where: { id: user.id },
            data: { doctorProfileId: null },
          });
          await tx.$executeRaw`
            DELETE FROM "DoctorAssignmentRequest"
            WHERE "doctorId" = ${doctor.id}
          `;
          await tx.doctor.delete({
            where: { id: doctor.id },
          });
        }

        await tx.pendingSignup.deleteMany({
          where: { email: user.email },
        });
        await tx.pendingPasswordReset.deleteMany({
          where: { email: user.email },
        });
        await tx.user.delete({
          where: { id: user.id },
        });
      });
    } else {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });

      await this.prisma.$transaction(async (tx) => {
        if (patient) {
          await tx.user.update({
            where: { id: user.id },
            data: { patientProfileId: null },
          });
          await tx.$executeRaw`
            DELETE FROM "DoctorAssignmentRequest"
            WHERE "patientId" = ${patient.id}
          `;
          await tx.$executeRaw`
            DELETE FROM "NavigationEvent"
            WHERE "patientId" = ${patient.id}
          `;
          await tx.activityLog.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.history.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.goal.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.note.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.favorite.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.safePlace.deleteMany({
            where: { patientId: patient.id },
          });
          await tx.patient.delete({
            where: { id: patient.id },
          });
        }

        await tx.pendingSignup.deleteMany({
          where: { email: user.email },
        });
        await tx.pendingPasswordReset.deleteMany({
          where: { email: user.email },
        });
        await tx.user.delete({
          where: { id: user.id },
        });
      });
    }

    this.clearAuthCookie(response);

    return {
      ok: true,
    };
  }
}
