// backend/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware'; // SINGULAR
import { LoggingMiddleware } from './common/middlewares/logging.middleware'; // SINGULAR

@Module({
  imports: [CommonModule],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}