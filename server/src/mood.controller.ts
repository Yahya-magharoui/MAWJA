import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { validateInput } from './validation';

type MoodState = 'hypo'|'window'|'hyper';

const moodBodySchema = z.object({
  userId: z.string().trim().min(1).max(64),
  state: z.enum(['hypo', 'window', 'hyper']),
  value: z.coerce.number().min(0).max(100),
  context: z.string().trim().max(255).optional(),
});

const moodQuerySchema = z.object({
  userId: z.string().trim().min(1).max(64),
  range: z.enum(['day', 'week', 'month']).optional(),
});

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
    const validatedBody = validateInput(moodBodySchema, body);
    const patientId = Number(String(validatedBody.userId).replace(/\D+/g, ''));
    if (!Number.isFinite(patientId)) {
      return { ok: false, message: 'patientId invalide' };
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; time: Date; state: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "History" (time, state, "patientId")
      VALUES (${new Date()}, CAST(${toHistoryState(validatedBody.state)} AS "HistoryState"), ${patientId})
      RETURNING id, time, state, "patientId", "createdAt"
    `;

    const history = rows[0];
    return {
      id: String(history?.id ?? ''),
      state: validatedBody.state,
      value: Math.max(0, Math.min(100, Number(validatedBody.value) || 0)),
      context: validatedBody.context ?? null,
      timestamp: history?.time ?? new Date(),
    };
  }

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('range') range: 'day'|'week'|'month' = 'day'
  ) {
    const validatedQuery = validateInput(moodQuerySchema, { userId, range });
    const now = new Date();
    const from = new Date(now);
    if (validatedQuery.range === 'week') from.setDate(now.getDate() - 7);
    else if (validatedQuery.range === 'month') from.setMonth(now.getMonth() - 1);
    else from.setDate(now.getDate() - 1);

    const patientId = Number(String(validatedQuery.userId).replace(/\D+/g, ''));
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
