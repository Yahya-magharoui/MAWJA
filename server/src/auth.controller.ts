import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { signAuthToken } from './auth-token';
import { createHash, randomBytes } from 'crypto';

type AuthBody = {
  email: string;
  password: string;
  confirmPassword?: string;
  role?: 'PATIENT' | 'DOCTOR';
};

type EmailCheckBody = {
  email: string;
};

type VerifyEmailBody = {
  token?: string;
};

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

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  private emailVerificationEnabled() {
    return process.env.EMAIL_VERIFICATION_ENABLED === 'true';
  }

  private getVerificationExpiryDate() {
    const hours = Number(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || 24);
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

  private async sendVerificationEmail(email: string, token: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      throw new HttpException(
        "La configuration de l'e-mail de confirmation est incomplète.",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const verificationLink = this.buildVerificationLink(token);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Confirme ton compte Mawja',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2 style="margin-bottom: 16px;">Bienvenue sur Mawja</h2>
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
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new HttpException(
        `Envoi de l'e-mail impossible.${errorBody ? ` ${errorBody}` : ''}`,
        HttpStatus.BAD_GATEWAY
      );
    }
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

    if (COMMON_PASSWORDS.has(loweredPassword)) {
      return 'Choisis un mot de passe moins courant.';
    }

    if (localPart && loweredPassword.includes(localPart)) {
      return "Le mot de passe ne doit pas contenir ton adresse e-mail.";
    }

    if (loweredPassword.includes('mawja')) {
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

  private serializeUser(user: LegacyUserRow) {
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

  private async registerUser(body: AuthBody) {
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

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return {
      ok: true,
      user: this.serializeUser(user),
      access_token: accessToken,
    };
  }

  @Post('signup')
  async signup(@Body() body: AuthBody) {
    return this.registerUser(body);
  }

  @Post('register')
  async register(@Body() body: AuthBody) {
    return this.registerUser(body);
  }

  @Post('check-email')
  async checkEmail(@Body() body: EmailCheckBody) {
    const email = this.normalizeEmail(body.email || '');

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
  async verifyEmail(@Body() body: VerifyEmailBody) {
    const token = body.token?.trim();

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

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return {
      ok: true,
      message: 'Adresse e-mail confirmée.',
      access_token: accessToken,
      user: this.serializeUser(user),
    };
  }

  @Get('verify-email')
  async verifyEmailFromQuery(@Query('token') token?: string) {
    return this.verifyEmail({ token });
  }

  @Post('login')
  async login(@Body() body: AuthBody) {
    const email = this.normalizeEmail(body.email || '');
    const password = body.password || '';

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

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return {
      ok: true,
      access_token: accessToken,
      user: this.serializeUser(user),
    };
  }
}
