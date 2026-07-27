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

type ActivityBody = {
  category: string;
  subType: string;
  detail?: string;
  emotion?: string;
  historyId: number;
};

@Controller('activities')
export class ActivitiesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: ActivityBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    const historyRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "History"
      WHERE id = ${Number(body.historyId)} AND "patientId" = ${patientId}
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
      VALUES (${patientId}, ${history.id}, ${body.category}, ${body.subType}, ${body.detail ?? null}, ${body.emotion ?? null})
      RETURNING id, "patientId", "historyId", category, "subType", detail, emotion, "createdAt"
    `;

    return rows[0] ?? null;
  }
}
