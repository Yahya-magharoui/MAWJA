import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('signup')
  async signup(@Body() body: { email: string; password: string }) {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password || password.length < 8) {
      throw new HttpException('Email ou mot de passe invalide (≥ 8 caractères)', HttpStatus.BAD_REQUEST);
    }

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new HttpException('Email déjà utilisé', HttpStatus.CONFLICT);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash: hash },
      select: { id: true, email: true, createdAt: true },
    });

    return { ok: true, user };
  }
}
