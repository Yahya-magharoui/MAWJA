import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { MoodController } from './mood.controller';
import { HistoriesController } from './histories.controller';
import { GoalsController } from './goals.controller';
import { NotesController } from './notes.controller';

@Module({
  imports: [],
  controllers: [
    HealthController,
    AuthController,
    MoodController,
    HistoriesController,
    GoalsController,
    NotesController,
    ActivitiesController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
