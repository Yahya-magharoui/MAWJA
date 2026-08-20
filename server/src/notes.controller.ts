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

type NoteBody = {
  text: string;
};

const noteBodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

@Controller('notes')
export class NotesController {
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
      FROM "Note"
      WHERE "patientId" = ${patientId}
      ORDER BY "createdAt" DESC
    `;
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Body() body: NoteBody
  ) {
    const validatedBody = validateInput(noteBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "Note" (text, "patientId")
      VALUES (${validatedBody.text}, ${patientId})
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) noteId: number,
    @Body() body: NoteBody
  ) {
    const validatedBody = validateInput(noteBodySchema, body);
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    const noteRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "Note"
      WHERE id = ${noteId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const note = noteRows[0] ?? null;

    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      UPDATE "Note"
      SET text = ${validatedBody.text}
      WHERE id = ${noteId}
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Param('id', ParseIntPipe) noteId: number
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization, cookieHeader);
    const patientId = user.patientProfileId;

    const noteRows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "Note"
      WHERE id = ${noteId} AND "patientId" = ${patientId}
      LIMIT 1
    `;
    const note = noteRows[0] ?? null;

    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }

    await this.prisma.$executeRaw`
      DELETE FROM "Note"
      WHERE id = ${noteId}
    `;

    return { ok: true };
  }
}
