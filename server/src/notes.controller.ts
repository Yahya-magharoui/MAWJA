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

type NoteBody = {
  text: string;
};

@Controller('notes')
export class NotesController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async listMine(@Headers('authorization') authorization: string | undefined) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);

    return this.prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: NoteBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);

    return this.prisma.note.create({
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
    @Body() body: NoteBody
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const noteId = Number(id);

    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    });

    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { text: body.text.trim() },
    });
  }

  @Delete(':id')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string
  ) {
    const user = await requireAuthenticatedUser(this.prisma, authorization);
    const noteId = Number(id);

    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    });

    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }

    await this.prisma.note.delete({
      where: { id: noteId },
    });

    return { ok: true };
  }
}
