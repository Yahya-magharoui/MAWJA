import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';
import { validateInput } from './validation';

const safePlaceAnswerSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().max(2000),
});

const safePlaceBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  answers: z
    .array(safePlaceAnswerSchema)
    .min(1)
    .max(12)
    .refine((answers) => answers.some((entry) => entry.answer.length > 0), {
      message: 'Au moins une réponse est requise.',
    }),
});

type SafePlaceBody = z.infer<typeof safePlaceBodySchema>;
type SafePlaceRow = {
  id: number;
  name: string;
  answers: Prisma.JsonValue;
  patientId: number;
  createdAt: Date;
};

@Controller('safe-places')
export class SafePlacesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async listMine(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    if (!user.patientProfileId) return [];

    return this.prisma.$queryRaw<SafePlaceRow[]>`
      SELECT id, name, answers, "patientId", "createdAt"
      FROM "SafePlace"
      WHERE "patientId" = ${user.patientProfileId}
      ORDER BY "createdAt" DESC
    `;
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() body: SafePlaceBody
  ) {
    const validatedBody = validateInput(safePlaceBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);

    if (!user.patientProfileId) {
      throw new HttpException('Profil utilisateur introuvable.', HttpStatus.BAD_REQUEST);
    }

    const answers = JSON.stringify(validatedBody.answers);
    const rows = await this.prisma.$queryRaw<SafePlaceRow[]>`
      INSERT INTO "SafePlace" (name, answers, "patientId")
      VALUES (${validatedBody.name}, ${answers}::jsonb, ${user.patientProfileId})
      RETURNING id, name, answers, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) safePlaceId: number
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    if (!user.patientProfileId) {
      throw new NotFoundException('Lieu sûr introuvable.');
    }

    const deleted = await this.prisma.$executeRaw`
      DELETE FROM "SafePlace"
      WHERE id = ${safePlaceId}
        AND "patientId" = ${user.patientProfileId}
    `;

    if (deleted === 0) {
      throw new NotFoundException('Lieu sûr introuvable.');
    }

    return { ok: true };
  }
}
