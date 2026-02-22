import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfWeek, endOfWeek } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TZ = 'Europe/Istanbul';

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
    const shiftDayOfWeek =
      Number(formatInTimeZone(startTime, TZ, 'i')) % 7; // 0=Sun, 6=Sat
    const shiftEndDayOfWeek =
      Number(formatInTimeZone(endTime, TZ, 'i')) % 7;
    const shiftStartMinutes =
      Number(formatInTimeZone(startTime, TZ, 'HH')) * 60 +
      Number(formatInTimeZone(startTime, TZ, 'mm'));
    const shiftEndMinutes =
      Number(formatInTimeZone(endTime, TZ, 'HH')) * 60 +
      Number(formatInTimeZone(endTime, TZ, 'mm'));
    const crossesMidnight = shiftDayOfWeek !== shiftEndDayOfWeek;

    const availabilityBlocks = await this.prisma.availabilityBlock.findMany({
      where: {
        employeeId,
        type: 'UNAVAILABLE',
        dayOfWeek: crossesMidnight
          ? { in: [shiftDayOfWeek, shiftEndDayOfWeek] }
          : shiftDayOfWeek,
      },
    });

    // Helper: get minutes from a Time-typed Date (1970-01-01T...)
    const getMinutes = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();

    // Filter: block time range must overlap with shift time
    const overlaps = (
      aStart: number,
      aEnd: number,
      bStart: number,
      bEnd: number,
    ) => aStart < bEnd && aEnd > bStart;

    const conflictingBlocks = availabilityBlocks.filter((b) => {
      if (!b.startTime || !b.endTime) return true; // full-day block
      const blockStart = getMinutes(b.startTime);
      const blockEnd = getMinutes(b.endTime);

      if (!crossesMidnight) {
        return overlaps(shiftStartMinutes, shiftEndMinutes, blockStart, blockEnd);
      }

      if (b.dayOfWeek === shiftDayOfWeek) {
        return overlaps(shiftStartMinutes, 24 * 60, blockStart, blockEnd);
      }

      if (b.dayOfWeek === shiftEndDayOfWeek) {
        return overlaps(0, shiftEndMinutes, blockStart, blockEnd);
      }

      return false;
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
      const weekStart = fromZonedTime(
        startOfWeek(startTime, { weekStartsOn: 1 }), TZ,
      );
      const weekEnd = fromZonedTime(
        endOfWeek(startTime, { weekStartsOn: 1 }), TZ,
      );

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
