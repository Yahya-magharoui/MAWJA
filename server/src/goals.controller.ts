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
    const patientId = user.patientProfileId;

    if (!patientId) {
      return [];
    }

    return this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      SELECT id, text, "patientId", "createdAt"
      FROM "Goal"
      WHERE "patientId" = ${patientId}
      ORDER BY "createdAt" DESC
    `;
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: GoalBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "Goal" (text, "patientId")
      VALUES (${body.text.trim()}, ${patientId})
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: GoalBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const goalId = Number(id);
    const patientId = user.patientProfileId;

    const goalRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "Goal"
      WHERE id = ${goalId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const goal = goalRows[0] ?? null;

    if (!goal) {
      throw new NotFoundException('Objectif introuvable.');
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      UPDATE "Goal"
      SET text = ${body.text.trim()}
      WHERE id = ${goalId}
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const goalId = Number(id);
    const patientId = user.patientProfileId;

    const goalRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "Goal"
      WHERE id = ${goalId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const goal = goalRows[0] ?? null;

    if (!goal) {
      throw new NotFoundException('Objectif introuvable.');
    }

    await this.prisma.$executeRaw`
      DELETE FROM "Goal"
      WHERE id = ${goalId}
    `;

    return { ok: true };
  }
}
