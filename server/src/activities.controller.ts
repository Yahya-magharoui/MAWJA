import {
  Body,
  Controller,
  Headers,
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

    const history = await this.prisma.history.findFirst({
      where: { id: Number(body.historyId), userId: user.id },
    });

    if (!history) {
      throw new NotFoundException('Historique introuvable.');
    }

    return this.prisma.activity.create({
      data: {
        userId: user.id,
        historyId: history.id,
        category: body.category,
        subType: body.subType,
        detail: body.detail ?? null,
        emotion: body.emotion ?? null,
      },
    });
  }
}
