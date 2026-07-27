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
};

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  private async findLegacyUserByEmail(email: string) {
    const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
      SELECT id, email, password, name, role, "createdAt"
      FROM "User"
      WHERE email = ${email}
      LIMIT 1
    `;

    return rows[0] ?? null;
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
      RETURNING id, email, password, name, role, "createdAt"
    `;
    const user = rows[0];

    if (!user) {
      throw new HttpException('Création du compte impossible.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
        createdAt: user.createdAt,
      },
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

    const user = await this.findLegacyUserByEmail(email);

    if (!user?.password) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return {
      ok: true,
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
