import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/types';

@ApiTags('Availability')
@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Müsaitlik bloklarını listele' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'dayOfWeek', required: false, description: '0=Pazar, 1=Pazartesi, ..., 6=Cumartesi' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('dayOfWeek') dayOfWeekStr?: string,
  ) {
    const dayOfWeek = dayOfWeekStr !== undefined ? parseInt(dayOfWeekStr, 10) : undefined;
    return this.availabilityService.findAll({ employeeId, dayOfWeek });
  }

  @Post()
  @ApiOperation({ summary: 'Müsait değilim bloğu ekle' })
  create(
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const targetEmployeeId =
      (user.role === 'ADMIN' || user.role === 'MANAGER')
        ? (dto.employeeId ?? user.employeeId)
        : user.employeeId;

    return this.availabilityService.create(dto, targetEmployeeId!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Müsaitlik bloğunu sil' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.availabilityService.remove(id, user.employeeId!, user.role);
  }
}
