// backend/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { NotificationsModule } from './modules/notifications/notifications.module'; // Add this
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LocationAccessGuard } from './common/guards/location-access.guard';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { LoggingMiddleware } from './common/middlewares/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    SkillsModule,
    ShiftsModule,
    NotificationsModule, // Add this
  ],
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
    {
      provide: APP_GUARD,
      useClass: LocationAccessGuard,
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