import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
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

    const history = await this.prisma.history.create({
      data: {
        userId: user.id,
        state: body.state,
        time: body.time ? new Date(body.time) : new Date(),
      },
    });

    return {
      id: history.id,
      time: history.time,
      state: history.state,
      patientId: user.id,
      createdAt: history.createdAt,
    };
  }

  @Get('me')
  async listMine(@Headers('authorization') authorization: string | undefined) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);

    const histories = await this.prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return histories.map((history) => ({
      id: history.id,
      time: history.time,
      state: history.state,
      patientId: user.id,
      createdAt: history.createdAt,
    }));
  }
}
