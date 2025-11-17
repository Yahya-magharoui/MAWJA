import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [],
  controllers: [HealthController, AuthController],
  providers: [PrismaService],
})
export class AppModule {}
