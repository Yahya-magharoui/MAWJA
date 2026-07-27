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

type NoteBody = {
  text: string;
};

@Controller('notes')
export class NotesController {
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
      FROM "Note"
      WHERE "patientId" = ${patientId}
      ORDER BY "createdAt" DESC
    `;
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: NoteBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const patientId = user.patientProfileId;

    if (!patientId) {
      throw new HttpException('Profil patient introuvable.', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; text: string; patientId: number; createdAt: Date }>
    >`
      INSERT INTO "Note" (text, "patientId")
      VALUES (${body.text.trim()}, ${patientId})
      RETURNING id, text, "patientId", "createdAt"
    `;

    return rows[0] ?? null;
  }

  @Put(':id')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: NoteBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const noteId = Number(id);
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
      SET text = ${body.text.trim()}
      WHERE id = ${noteId}
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
    const noteId = Number(id);
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
