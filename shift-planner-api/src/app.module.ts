import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AvailabilityModule } from './availability/availability.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { RootController } from './root.controller';

@Module({
  controllers: [RootController],
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Logging
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,    // 1 minute
        limit: 100,     // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000,  // 1 hour
        limit: 1000,    // 1000 requests per hour
      },
    ]),

    // App modules
    PrismaModule,
    AuthModule,
    EmployeesModule,
    ShiftsModule,
    AvailabilityModule,
    ScheduleModule,
    ReportsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
