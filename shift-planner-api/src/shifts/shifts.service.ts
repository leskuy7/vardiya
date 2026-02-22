import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ShiftsValidator } from './shifts.validator';
import { CreateShiftDto, UpdateShiftDto, CopyWeekDto } from './dto';
import {
  parseISO,
  startOfWeek,
  addDays,
  differenceInDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { ShiftStatus } from '@prisma/client';

const TZ = 'Europe/Istanbul';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    private prisma: PrismaService,
    private validator: ShiftsValidator,
    private auditService: AuditService,
  ) {}

  async findAll(filters: {
    employeeId?: string;
    start?: string;
    end?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.start) {
      const startLocal = startOfDay(parseISO(filters.start));
      where.startTime = { gte: fromZonedTime(startLocal, TZ) };
    }
    if (filters.end) {
      const endLocal = endOfDay(parseISO(filters.end));
      where.endTime = { lte: fromZonedTime(endLocal, TZ) };
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: { id: true, position: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, position: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Vardiya bulunamadı',
      });
    }

    return shift;
  }

  async create(dto: CreateShiftDto, userId: string) {
    const startTime = new Date(dto.startTime);
    let endTime = new Date(dto.endTime);

    // Handle overnight shifts: if endTime <= startTime, add 1 day to end
    if (endTime <= startTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    // Validate
    const validation = await this.validator.validateShift(
      dto.employeeId,
      startTime,
      endTime,
      dto.forceOverride || false,
    );

    if (!validation.valid) {
      const firstError = validation.errors[0];
      if (firstError.code === 'SHIFT_OVERLAP') {
        throw new ConflictException({
          code: firstError.code,
          message: firstError.message,
          details: firstError.details,
        });
      }
      if (firstError.code === 'AVAILABILITY_CONFLICT') {
        throw new UnprocessableEntityException({
          code: firstError.code,
          message: firstError.message,
          details: firstError.details,
        });
      }
      throw new BadRequestException({
        code: firstError.code,
        message: firstError.message,
      });
    }

    const shift = await this.prisma.shift.create({
      data: {
        employeeId: dto.employeeId,
        startTime,
        endTime,
        note: dto.note,
        status: dto.status ? (dto.status as ShiftStatus) : undefined,
      },
      include: {
        employee: {
          select: { id: true, position: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    // Audit log for override
    if (dto.forceOverride) {
      await this.auditService.log({
        userId,
        action: 'OVERRIDE_AVAILABILITY',
        entityType: 'Shift',
        entityId: shift.id,
        details: { employeeId: dto.employeeId, startTime, endTime },
      });
    }

    // Audit log for creation
    await this.auditService.log({
      userId,
      action: 'SHIFT_CREATED',
      entityType: 'Shift',
      entityId: shift.id,
      details: { employeeId: dto.employeeId, startTime, endTime },
    });

    this.logger.log(`Shift created: ${shift.id} for employee ${dto.employeeId}`);

    return {
      ...shift,
      warnings: validation.warnings,
    };
  }

  async update(id: string, dto: UpdateShiftDto, userId: string) {
    const existing = await this.findOne(id);

    const employeeId = dto.employeeId || existing.employeeId;
    const startTime = dto.startTime ? new Date(dto.startTime) : existing.startTime;
    let endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    // Handle overnight shifts
    if (endTime <= startTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }

    // Validate (exclude current shift from overlap check)
    const validation = await this.validator.validateShift(
      employeeId,
      startTime,
      endTime,
      dto.forceOverride || false,
      id,
    );

    if (!validation.valid) {
      const firstError = validation.errors[0];
      if (firstError.code === 'SHIFT_OVERLAP') {
        throw new ConflictException({
          code: firstError.code,
          message: firstError.message,
          details: firstError.details,
        });
      }
      if (firstError.code === 'AVAILABILITY_CONFLICT') {
        throw new UnprocessableEntityException({
          code: firstError.code,
          message: firstError.message,
          details: firstError.details,
        });
      }
      throw new BadRequestException({
        code: firstError.code,
        message: firstError.message,
      });
    }

    const shift = await this.prisma.shift.update({
      where: { id },
      data: {
        employeeId,
        startTime,
        endTime,
        note: dto.note ?? (existing as any).note,
        ...(dto.status ? { status: dto.status as ShiftStatus } : {}),
      },
      include: {
        employee: {
          select: { id: true, position: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: 'SHIFT_UPDATED',
      entityType: 'Shift',
      entityId: shift.id,
      details: { before: existing, after: shift },
    });

    this.logger.log(`Shift updated: ${shift.id}`);

    return {
      ...shift,
      warnings: validation.warnings,
    };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    await this.prisma.shift.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      userId,
      action: 'SHIFT_CANCELLED',
      entityType: 'Shift',
      entityId: id,
      details: {},
    });

    this.logger.log(`Shift cancelled: ${id}`);
    return { message: 'Vardiya iptal edildi' };
  }

  async acknowledge(id: string, employeeId: string) {
    const shift = await this.findOne(id);

    if (shift.employeeId !== employeeId) {
      throw new BadRequestException({
        code: 'NOT_YOUR_SHIFT',
        message: 'Bu vardiya size ait değil',
      });
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' },
    });

    this.logger.log(`Shift acknowledged: ${id} by employee ${employeeId}`);
    return updated;
  }

  async copyWeek(dto: CopyWeekDto, userId: string) {
    const sourceParsed = parseISO(dto.sourceWeekStart);
    const sourceStartLocal = startOfWeek(sourceParsed, { weekStartsOn: 1 });
    const sourceStartUtc = fromZonedTime(sourceStartLocal, TZ);
    const sourceEndUtc = fromZonedTime(addDays(sourceStartLocal, 7), TZ);

    const targetParsed = parseISO(dto.targetWeekStart);
    const targetStartLocal = startOfWeek(targetParsed, { weekStartsOn: 1 });
    const targetStartUtc = fromZonedTime(targetStartLocal, TZ);

    const dayDiff = differenceInDays(targetStartUtc, sourceStartUtc);

    // Get source week shifts
    const sourceShifts = await this.prisma.shift.findMany({
      where: {
        startTime: { gte: sourceStartUtc },
        endTime: { lte: sourceEndUtc },
        status: { not: 'CANCELLED' },
      },
    });

    if (sourceShifts.length === 0) {
      throw new BadRequestException({
        code: 'NO_SHIFTS_TO_COPY',
        message: 'Kaynak haftada kopyalanacak vardiya bulunamadı',
      });
    }

    const createdShifts = [];
    const errors = [];

    for (const sourceShift of sourceShifts) {
      const newStartTime = addDays(sourceShift.startTime, dayDiff);
      const newEndTime = addDays(sourceShift.endTime, dayDiff);

      try {
        const validation = await this.validator.validateShift(
          sourceShift.employeeId,
          newStartTime,
          newEndTime,
          false,
        );

        if (validation.valid) {
          const newShift = await this.prisma.shift.create({
            data: {
              employeeId: sourceShift.employeeId,
              startTime: newStartTime,
              endTime: newEndTime,
              note: (sourceShift as any).note,
            },
          });
          createdShifts.push(newShift);
        } else {
          errors.push({
            sourceShiftId: sourceShift.id,
            error: validation.errors[0]?.message,
          });
        }
      } catch (err) {
        errors.push({
          sourceShiftId: sourceShift.id,
          error: err.message,
        });
      }
    }

    await this.auditService.log({
      userId,
      action: 'WEEK_COPIED',
      entityType: 'Schedule',
      entityId: dto.targetWeekStart,
      details: {
        source: dto.sourceWeekStart,
        target: dto.targetWeekStart,
        created: createdShifts.length,
        errors: errors.length,
      },
    });

    this.logger.log(
      `Week copied: ${dto.sourceWeekStart} → ${dto.targetWeekStart} (${createdShifts.length} created, ${errors.length} errors)`,
    );

    return {
      created: createdShifts.length,
      errors: errors.length,
      shifts: createdShifts,
      skipped: errors,
    };
  }

  async bulkCreate(shifts: CreateShiftDto[], userId: string) {
    const results = [];
    const errors = [];

    for (const shiftDto of shifts) {
      try {
        const shift = await this.create(shiftDto, userId);
        results.push(shift);
      } catch (err) {
        errors.push({
          shift: shiftDto,
          error: err.message,
        });
      }
    }

    return {
      created: results.length,
      errors: errors.length,
      shifts: results,
      failed: errors,
    };
  }
}
