import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('weekly-hours')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Haftalık saat ve maliyet raporu' })
  @ApiQuery({ name: 'weekStart', required: true, example: '2026-02-16' })
  @ApiQuery({ name: 'start', required: false, example: '2026-02-16' })
  getWeeklyHoursReport(
    @Query('weekStart') weekStart?: string,
    @Query('start') start?: string,
  ) {
    const startDate = weekStart || start;
    if (!startDate) {
      throw new BadRequestException({
        code: 'WEEK_START_REQUIRED',
        message: 'weekStart (veya start) query parametresi zorunludur',
      });
    }
    return this.reportsService.getWeeklyHoursReport(startDate);
  }
}
