import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';

type MoodState = 'hypo'|'window'|'hyper';

@Controller('mood')
export class MoodController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() body: { userId: string; state: MoodState; value: number; context?: string }) {
    return this.prisma.moodEntry.create({
      data: {
        userId: body.userId,
        state: body.state,
        value: Math.max(0, Math.min(100, Number(body.value) || 0)),
        context: body.context ?? null,
      },
    });
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

    return this.prisma.moodEntry.findMany({
      where: { userId, timestamp: { gte: from, lte: now } },
      orderBy: { timestamp: 'desc' },
    });
  }
}
