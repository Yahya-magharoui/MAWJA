import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';

type MoodState = 'hypo'|'window'|'hyper';

function toHistoryState(state: MoodState) {
  if (state === 'hyper') return 'HYPER';
  if (state === 'hypo') return 'HYPO';
  return 'TOLERANCE';
}

function fromHistoryState(state: string): MoodState {
  if (state === 'HYPER') return 'hyper';
  if (state === 'HYPO') return 'hypo';
  return 'window';
}

@Controller('mood')
export class MoodController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() body: { userId: string; state: MoodState; value: number; context?: string }) {
    const patientId = Number(String(body.userId).replace(/\D+/g, ''));
    if (!Number.isFinite(patientId)) {
      return { ok: false, message: 'patientId invalide' };
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; time: Date; state: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "History" (time, state, "patientId")
      VALUES (${new Date()}, ${toHistoryState(body.state)}, ${patientId})
      RETURNING id, time, state, "patientId", "createdAt"
    `;

    const history = rows[0];
    return {
      id: String(history?.id ?? ''),
      state: body.state,
      value: Math.max(0, Math.min(100, Number(body.value) || 0)),
      context: body.context ?? null,
      timestamp: history?.time ?? new Date(),
    };
  }

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('range') range: 'day'|'week'|'month' = 'day'
  ) {
    const now = new Date();
    const from = new Date(now);
    if (range === 'week') from.setDate(now.getDate() - 7);
    else if (range === 'month') from.setMonth(now.getMonth() - 1);
    else from.setDate(now.getDate() - 1);

    const patientId = Number(String(userId).replace(/\D+/g, ''));
    if (!Number.isFinite(patientId)) {
      return [];
    }

    const histories = await this.prisma.$queryRaw<
      Array<{ id: number; time: Date; state: string; createdAt: Date }>
    >`
      SELECT id, time, state, "createdAt"
      FROM "History"
      WHERE "patientId" = ${patientId}
        AND time >= ${from}
        AND time <= ${now}
      ORDER BY time DESC
    `;

    return histories.map((item) => ({
      id: String(item.id),
      state: fromHistoryState(item.state),
      value: 50,
      context: null,
      timestamp: item.time,
    }));
  }
}
