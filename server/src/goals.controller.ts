import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';

type GoalBody = {
  text: string;
};

@Controller('goals')
export class GoalsController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async listMine(@Headers('authorization') authorization: string | undefined) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);

    return this.prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: GoalBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);

    return this.prisma.goal.create({
      data: {
        userId: user.id,
        text: body.text.trim(),
      },
    });
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: GoalBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const goalId = Number(id);

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      throw new NotFoundException('Objectif introuvable.');
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { text: body.text.trim() },
    });
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const goalId = Number(id);

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      throw new NotFoundException('Objectif introuvable.');
    }

    await this.prisma.goal.delete({
      where: { id: goalId },
    });

    return { ok: true };
  }
}
