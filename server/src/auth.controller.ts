import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { signAuthToken } from './auth-token';

type AuthBody = {
  email: string;
  password: string;
  role?: 'PATIENT' | 'DOCTOR';
};

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  private async registerUser(body: AuthBody) {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const role = body.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    if (!email || !password || password.length < 8) {
      throw new HttpException('Email ou mot de passe invalide (≥ 8 caractères)', HttpStatus.BAD_REQUEST);
    }

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new HttpException('Email déjà utilisé', HttpStatus.CONFLICT);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash: hash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const accessToken = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
    });

    return { ok: true, user, access_token: accessToken };
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

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpException('Identifiants invalides.', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = signAuthToken({
      sub: user.id,
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
