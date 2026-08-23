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
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { validateInput } from './validation';

type GoalBody = {
  text: string;
};

const goalBodySchema = z.object({
  text: z.string().trim().min(1).max(500),
});

@Controller('goals')
export class GoalsController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async listMine(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
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
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() body: GoalBody
  ) {
    const validatedBody = validateInput(goalBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil utilisateur introuvable.', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "Goal" (text, "patientId")
      VALUES (${validatedBody.text}, ${patientId})
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) goalId: number,
    @Body() body: GoalBody
  ) {
    const validatedBody = validateInput(goalBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
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
      SET text = ${validatedBody.text}
      WHERE id = ${goalId}
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) goalId: number
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
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
