import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { validateInput } from './validation';

type ActivityBody = {
  category: string;
  subType: string;
  detail?: string;
  emotion?: string;
  historyId: number;
};

const activityBodySchema = z.object({
  category: z.string().trim().min(1).max(64),
  subType: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(1000).optional(),
  emotion: z.string().trim().max(64).optional(),
  historyId: z.coerce.number().int().positive(),
});

@Controller('activities')
export class ActivitiesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() body: ActivityBody
  ) {
    const validatedBody = validateInput(activityBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil utilisateur introuvable.', HttpStatus.BAD_REQUEST);
    }

    const historyRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "History"
      WHERE id = ${validatedBody.historyId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const history = historyRows[0] ?? null;

    if (!history) {
      throw new NotFoundException('Historique introuvable.');
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        patientId: number;
        historyId: number | null;
        category: string;
        subType: string;
        detail: string | null;
        emotion: string | null;
        createdAt: Date;
      }>
    >`
      INSERT INTO "ActivityLog" ("patientId", "historyId", category, "subType", detail, emotion)
      VALUES (
        ${patientId},
        ${history.id},
        CAST(${validatedBody.category} AS "ActivityCategory"),
        ${validatedBody.subType},
        ${validatedBody.detail ?? null},
        CAST(${validatedBody.emotion ?? null} AS "EmotionType")
      )
      RETURNING id, "patientId", "historyId", category, "subType", detail, emotion, "createdAt"
    `;

    return rows[0] ?? null;
  }
}
