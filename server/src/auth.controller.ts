import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { signAuthToken } from './auth-token';

type AuthBody = {
  email: string;
  password: string;
  role?: 'PATIENT' | 'DOCTOR';
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

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

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

  private async registerUser(body: AuthBody) {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const role = body.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    if (!email || !password || password.length < 8) {
      throw new HttpException('Email ou mot de passe invalide (≥ 8 caractères)', HttpStatus.BAD_REQUEST);
    }

    const exists = await this.findLegacyUserByEmail(email);
    if (exists) {
      throw new HttpException('Email déjà utilisé', HttpStatus.CONFLICT);
    }

    const hash = await bcrypt.hash(password, 10);
    const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
      INSERT INTO "User" (email, password, role)
      VALUES (${email}, ${hash}, ${role})
      RETURNING id, email, password, name, role, "createdAt", "patientProfileId", "doctorProfileId"
    `;
    const createdUser = rows[0];

    if (!createdUser) {
      throw new HttpException('Création du compte impossible.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const user = await this.syncUserProfiles(createdUser);

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

  @Post('login')
  async login(@Body() body: AuthBody) {
    const email = (body.email || '').trim().toLowerCase();
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
