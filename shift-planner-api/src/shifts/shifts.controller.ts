import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto, CopyWeekDto, BulkCreateShiftDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Vardiyaları listele' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'start', required: false, example: '2026-02-16' })
  @ApiQuery({ name: 'end', required: false, example: '2026-02-22' })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftsService.findAll({ employeeId, start, end, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Vardiya detayı' })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Yeni vardiya oluştur' })
  @ApiResponse({ status: 201, description: 'Vardiya oluşturuldu' })
  @ApiResponse({ status: 409, description: 'Çakışma hatası' })
  @ApiResponse({ status: 422, description: 'Müsaitlik çakışması' })
  async create(
    @Body() dto: CreateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.shiftsService.create(dto, user.id);

    // Set warnings as response header (base64-encoded for non-ASCII compatibility)
    if (result.warnings && result.warnings.length > 0) {
      const encoded = Buffer.from(JSON.stringify(result.warnings)).toString('base64');
      res.setHeader('X-Warnings', encoded);
    }

    return result;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Vardiya güncelle' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.shiftsService.update(id, dto, user.id);

    if (result.warnings && result.warnings.length > 0) {
      const encoded = Buffer.from(JSON.stringify(result.warnings)).toString('base64');
      res.setHeader('X-Warnings', encoded);
    }

    return result;
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Vardiya iptal et' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.remove(id, user.id);
  }

  @Post(':id/acknowledge')
  @Roles(Role.EMPLOYEE)
  @ApiOperation({ summary: 'Vardiyayı "gördüm" olarak işaretle' })
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.acknowledge(id, user.employeeId!);
  }

  @Post('copy-week')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Haftayı kopyala' })
  copyWeek(
    @Body() dto: CopyWeekDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.copyWeek(dto, user.id);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Toplu vardiya oluştur' })
  bulkCreate(
    @Body() dto: BulkCreateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.bulkCreate(dto.shifts, user.id);
  }
}
