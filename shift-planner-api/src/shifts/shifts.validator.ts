import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime } from 'luxon';

export interface ShiftValidationResult {
  valid: boolean;
  warnings: string[];
  errors: { code: string; message: string; details?: any }[];
}

@Injectable()
export class ShiftsValidator {
  private readonly logger = new Logger(ShiftsValidator.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Time overlap detection: [start, end) - half-open interval
   * Two shifts overlap if: A.start < B.end AND A.end > B.start
   */
  async validateShift(
    employeeId: string,
    startTime: Date,
    endTime: Date,
    forceOverride: boolean = false,
    excludeShiftId?: string,
  ): Promise<ShiftValidationResult> {
    const result: ShiftValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
    };

    // 1. endTime must be after startTime
    if (endTime <= startTime) {
      result.valid = false;
      result.errors.push({
        code: 'INVALID_TIME_RANGE',
        message: 'Vardiya bitiş saati başlangıç saatinden sonra olmalıdır',
      });
      return result;
    }

    // 2. Check minimum shift duration (2 hours) - warning only
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < 2) {
      result.warnings.push(
        `Vardiya süresi çok kısa: ${durationHours.toFixed(1)} saat (min. 2 saat önerilir)`,
      );
    }

    // 3. Check shift overlap with existing shifts
    const overlapCondition: any = {
      employeeId,
      status: { not: 'CANCELLED' },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeShiftId) {
      overlapCondition.id = { not: excludeShiftId };
    }

    const overlappingShifts = await this.prisma.shift.findMany({
      where: overlapCondition,
      select: { id: true, startTime: true, endTime: true },
    });

    if (overlappingShifts.length > 0) {
      result.valid = false;
      result.errors.push({
        code: 'SHIFT_OVERLAP',
        message: 'Bu çalışanın aynı saatlerde başka bir vardiyası var',
        details: {
          conflictingShiftIds: overlappingShifts.map((s) => s.id),
          conflicts: overlappingShifts.map((s) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
      });
      return result;
    }

    // 4. Check availability conflicts (dayOfWeek-based)
    const shiftDayOfWeek = startTime.getDay(); // 0=Sun, 6=Sat
    const shiftStartHHmm = startTime.toTimeString().slice(0, 5); // "HH:MM"
    const shiftEndHHmm = endTime.toTimeString().slice(0, 5);

    const availabilityBlocks = await this.prisma.availabilityBlock.findMany({
      where: {
        employeeId,
        type: 'UNAVAILABLE',
        dayOfWeek: shiftDayOfWeek,
      },
    });

    // Filter: block time range must overlap with shift time
    const conflictingBlocks = availabilityBlocks.filter((b) => {
      if (!b.startTime || !b.endTime) return true; // full-day block
      return b.startTime < shiftEndHHmm && b.endTime > shiftStartHHmm;
    });

    if (conflictingBlocks.length > 0) {
      if (!forceOverride) {
        result.valid = false;
        result.errors.push({
          code: 'AVAILABILITY_CONFLICT',
          message: 'Çalışan bu saatlerde müsait değil',
          details: {
            blocks: conflictingBlocks.map((b) => ({
              id: b.id,
              dayOfWeek: b.dayOfWeek,
              startTime: b.startTime,
              endTime: b.endTime,
            })),
          },
        });
        return result;
      } else {
        result.warnings.push(
          'Müsaitlik çakışması yönetici tarafından geçersiz kılındı (override)',
        );
      }
    }

    // 5. Check weekly hours limit - warning only
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { maxWeeklyHours: true },
    });

    if (employee) {
      const weekStart = DateTime.fromJSDate(startTime)
        .setZone('Europe/Istanbul')
        .startOf('week')
        .toUTC()
        .toJSDate();
      const weekEnd = DateTime.fromJSDate(startTime)
        .setZone('Europe/Istanbul')
        .endOf('week')
        .toUTC()
        .toJSDate();

      const weekShifts = await this.prisma.shift.findMany({
        where: {
          employeeId,
          status: { not: 'CANCELLED' },
          startTime: { gte: weekStart },
          endTime: { lte: weekEnd },
          ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
        },
        select: { startTime: true, endTime: true },
      });

      const totalExistingHours = weekShifts.reduce((sum, s) => {
        return (
          sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
        );
      }, 0);

      const totalWithNew = totalExistingHours + durationHours;
      if (totalWithNew > employee.maxWeeklyHours) {
        result.warnings.push(
          `Haftalık saat limiti aşılıyor: ${totalWithNew.toFixed(1)}/${employee.maxWeeklyHours} saat`,
        );
      }
    }

    return result;
  }
}
