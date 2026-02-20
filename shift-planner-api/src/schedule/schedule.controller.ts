import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Schedule')
@Controller('schedule')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('week')
  @ApiOperation({ summary: 'Haftalık vardiya planı' })
  @ApiQuery({ name: 'start', required: true, example: '2026-02-16' })
  getWeeklySchedule(@Query('start') start: string) {
    return this.scheduleService.getWeeklySchedule(start);
  }

  @Get('print')
  @ApiOperation({ summary: 'Yazdırılabilir haftalık plan' })
  @ApiQuery({ name: 'start', required: true, example: '2026-02-16' })
  getPrintView(@Query('start') start: string) {
    return this.scheduleService.getPrintView(start);
  }
}
