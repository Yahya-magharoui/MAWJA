import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';

type HistoryBody = {
  time?: string;
  state: 'HYPER' | 'TOLERANCE' | 'HYPO';
};

@Controller('histories')
export class HistoriesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: HistoryBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; time: Date; state: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "History" (time, state, "patientId")
      VALUES (${body.time ? new Date(body.time) : new Date()}, ${body.state}, ${patientId})
      RETURNING id, time, state, "patientId", "createdAt"
    `;
    const history = rows[0];

    return {
      id: history?.id,
      time: history?.time,
      state: history?.state,
      patientId: history?.patientId,
      createdAt: history?.createdAt,
    };
  }

  @Get('me')
  async listMine(@Headers('authorization') authorization: string | undefined) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const patientId = user.patientProfileId;

    if (!patientId) {
      return [];
    }

    const histories = await this.prisma.$queryRaw<
      Array<{ id: number; time: Date; state: string; patientId: number; createdAt: Date }>
    >`
      SELECT id, time, state, "patientId", "createdAt"
      FROM "History"
      WHERE "patientId" = ${patientId}
      ORDER BY "createdAt" DESC
    `;

    return histories.map((history) => ({
      id: history.id,
      time: history.time,
      state: history.state,
      patientId: history.patientId,
      createdAt: history.createdAt,
    }));
  }
}
