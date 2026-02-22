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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tüm çalışanları listele' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('active') active?: boolean) {
    return this.employeesService.findAll(active);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Çalışan detayı' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Yeni çalışan oluştur' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Çalışan güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Çalışan sil (soft delete)' })
  remove(@Param('id') id: string) {
    return this.employeesService.softDelete(id);
  }
}
