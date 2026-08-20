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
} from '@nestjs/common';
import { requireAuthenticatedUser } from './auth-token';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { validateInput } from './validation';

type FavoriteBody = {
  key: string;
  title: string;
  description?: string | null;
};

const favoriteBodySchema = z.object({
  key: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).nullable().optional(),
});

@Controller('favorites')
export class FavoritesController {
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

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        patientId: number;
        exerciseId: number;
        createdAt: Date;
        title: string;
        description: string | null;
      }>
    >`
      SELECT
        f.id,
        f."patientId",
        f."exerciseId",
        f."createdAt",
        e.title,
        e.description
      FROM "Favorite" f
      INNER JOIN "Exercice" e ON e.id = f."exerciseId"
      WHERE f."patientId" = ${patientId}
      ORDER BY f."createdAt" DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patientId,
      exerciseId: row.exerciseId,
      createdAt: row.createdAt,
      exercise: {
        id: row.exerciseId,
        title: row.title,
        description: row.description,
      },
    }));
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() body: FavoriteBody
  ) {
    const validatedBody = validateInput(favoriteBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;
    const title = validatedBody.title?.trim();

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    if (!title) {
      throw new HttpException('Titre d’exercice manquant.', HttpStatus.BAD_REQUEST);
    }

    const exerciseRows = await this.prisma.$queryRaw<
      Array<{ id: number; title: string; description: string | null }>
    >`
      SELECT id, title, description
      FROM "Exercice"
      WHERE title = ${title}
      LIMIT 1
    `;

    const existingExercise = exerciseRows[0] ?? null;

    const exercise =
      existingExercise ??
      (
        await this.prisma.$queryRaw<
          Array<{ id: number; title: string; description: string | null }>
        >`
          INSERT INTO "Exercice" (title, description)
          VALUES (${title}, ${validatedBody.description?.trim() || null})
          RETURNING id, title, description
        `
      )[0];

    const favoriteRows = await this.prisma.$queryRaw<
      Array<{ id: number; patientId: number; exerciseId: number; createdAt: Date }>
    >`
      SELECT id, "patientId", "exerciseId", "createdAt"
      FROM "Favorite"
      WHERE "patientId" = ${patientId} AND "exerciseId" = ${exercise.id}
      LIMIT 1
    `;

    const favorite =
      favoriteRows[0] ??
      (
        await this.prisma.$queryRaw<
          Array<{ id: number; patientId: number; exerciseId: number; createdAt: Date }>
        >`
          INSERT INTO "Favorite" ("patientId", "exerciseId")
          VALUES (${patientId}, ${exercise.id})
          RETURNING id, "patientId", "exerciseId", "createdAt"
        `
      )[0];

    return {
      id: favorite.id,
      patientId: favorite.patientId,
      exerciseId: favorite.exerciseId,
      createdAt: favorite.createdAt,
      exercise: {
        id: exercise.id,
        title: exercise.title,
        description: exercise.description,
      },
    };
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) favoriteId: number
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    const favoriteRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "Favorite"
      WHERE id = ${favoriteId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const favorite = favoriteRows[0] ?? null;

    if (!favorite) {
      throw new NotFoundException('Favori introuvable.');
    }

    await this.prisma.$executeRaw`
      DELETE FROM "Favorite"
      WHERE id = ${favoriteId}
    `;

    return { ok: true };
  }
}
