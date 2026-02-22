import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  private resolveDisplayName(dto: {
    name?: string;
    firstName?: string;
    lastName?: string;
  }) {
    if (dto.name?.trim()) {
      return dto.name.trim();
    }
    const combined = `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();
    return combined;
  }

  async findAll(active?: boolean) {
    const where: any = {
      deletedAt: null,
    };
    if (active !== undefined) {
      where.isActive = active;
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Çalışan bulunamadı',
      });
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_EXISTS',
        message: 'Bu email adresi zaten kayıtlı',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const resolvedName = this.resolveDisplayName(dto);

    if (!resolvedName) {
      throw new BadRequestException({
        code: 'NAME_REQUIRED',
        message: 'Çalışan adı zorunludur',
      });
    }

    const employee = await this.prisma.employee.create({
      data: {
        position: dto.position,
        department: dto.department,
        phone: dto.phone,
        hourlyRate: dto.hourlyRate,
        maxWeeklyHours: dto.maxWeeklyHours || 45,
        user: {
          create: {
            email: dto.email,
            passwordHash,
            name: resolvedName,
            role: dto.role || 'EMPLOYEE',
          },
        },
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    this.logger.log(`Employee created: ${employee.user?.name ?? employee.id}`);
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    const updateData: any = {};
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.hourlyRate !== undefined) updateData.hourlyRate = dto.hourlyRate;
    if (dto.maxWeeklyHours !== undefined) updateData.maxWeeklyHours = dto.maxWeeklyHours;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const resolvedName = this.resolveDisplayName(dto);
    if (resolvedName) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { name: resolvedName },
      });
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    // Update role if provided
    if (dto.role) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { role: dto.role },
      });
    }

    this.logger.log(`Employee updated: ${id}`);
    return updated;
  }

  async softDelete(id: string) {
    await this.findOne(id);

    await this.prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Employee soft deleted: ${id}`);
    return { message: 'Çalışan başarıyla silindi' };
  }
}
