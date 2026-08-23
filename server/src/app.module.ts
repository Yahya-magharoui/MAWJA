import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { HistoriesController } from './histories.controller';
import { GoalsController } from './goals.controller';
import { NotesController } from './notes.controller';
import { FavoritesController } from './favorites.controller';
import { AuthVerificationService } from './auth-verification.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [],
  controllers: [
    HealthController,
    AuthController,
    HistoriesController,
    GoalsController,
    NotesController,
    FavoritesController,
    ActivitiesController,
  ],
  providers: [PrismaService, AuthVerificationService, RateLimitService],
})
export class AppModule {}
