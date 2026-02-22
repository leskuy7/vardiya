import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseISO, startOfWeek, addDays, format } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TZ = 'Europe/Istanbul';

function toMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function overlapsTimeRange(startA: number, endA: number, startB: number, endB: number) {
  const normalize = (start: number, end: number) =>
    end <= start ? { start, end: end + 1440 } : { start, end };

  const first = normalize(startA, endA);
  const second = normalize(startB, endB);

  if (Math.max(first.start, second.start) < Math.min(first.end, second.end)) {
    return true;
  }

  const shiftedSecond = { start: second.start + 1440, end: second.end + 1440 };
  if (Math.max(first.start, shiftedSecond.start) < Math.min(first.end, shiftedSecond.end)) {
    return true;
  }

  const shiftedFirst = { start: first.start + 1440, end: first.end + 1440 };
  return Math.max(shiftedFirst.start, second.start) < Math.min(shiftedFirst.end, second.end);
}

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private prisma: PrismaService) { }

  async getWeeklySchedule(weekStartStr: string) {
    // Parse the date string as zoned in Istanbul and get Monday
    const parsed = parseISO(weekStartStr);
    const weekStartLocal = startOfWeek(parsed, { weekStartsOn: 1 });
    const weekEndLocal = addDays(weekStartLocal, 7);

    const weekStartUtc = fromZonedTime(weekStartLocal, TZ);
    const weekEndUtc = fromZonedTime(weekEndLocal, TZ);

    // Fetch all active employees
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        userId: true,
        position: true,
        department: true,
        phone: true,
        maxWeeklyHours: true,
        hourlyRate: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    // Fetch all shifts for the week
    const shifts = await this.prisma.shift.findMany({
      where: {
        startTime: { gte: weekStartUtc },
        endTime: { lte: weekEndUtc },
        status: { not: 'CANCELLED' },
      },
      orderBy: { startTime: 'asc' },
    });

    // Fetch all availability blocks (recurring, by day of week)
    const availabilityBlocks = await this.prisma.availabilityBlock.findMany({
      where: {
        employee: { isActive: true, deletedAt: null },
      },
    });

    // Build the weekly schedule grouped by employee and day
    const schedule = employees.map((emp) => {
      const empShifts = shifts.filter((s) => s.employeeId === emp.id);
      const empBlocks = availabilityBlocks.filter(
        (b) => b.employeeId === emp.id,
      );

      // Calculate total hours
      const totalHours = empShifts.reduce((sum, s) => {
        return (
          sum +
          (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
        );
      }, 0);

      // Group by days
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayLocal = addDays(weekStartLocal, i);
        const dayStr = format(dayLocal, 'yyyy-MM-dd');
        const dayStartUtc = fromZonedTime(dayLocal, TZ);
        const dayEndUtc = fromZonedTime(addDays(dayLocal, 1), TZ);

        const dayShifts = empShifts
          .filter((s) => s.startTime >= dayStartUtc && s.startTime < dayEndUtc)
          .map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            note: (s as any).note,
            status: s.status,
          }));

        const isoDay = Number(formatInTimeZone(dayLocal, TZ, 'i'));
        const jsDay = isoDay % 7; // 0=Sun..6=Sat
        const dayUnavailable = empBlocks
          .filter((b) => b.dayOfWeek === jsDay && b.type === 'UNAVAILABLE')
          .map((b) => {
            const fmtTime = (d: Date | string | null) => {
              if (!d) return null;
              if (typeof d === 'string') {
                return d.length >= 5 ? d.slice(0, 5) : d;
              }
              return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
            };
            return {
              id: b.id,
              dayOfWeek: b.dayOfWeek,
              startTime: fmtTime(b.startTime),
              endTime: fmtTime(b.endTime),
            };
          });

        const hasConflict = dayShifts.some((shift) => {
          const shiftStart = formatInTimeZone(shift.startTime, TZ, 'HH:mm');
          const shiftEnd = formatInTimeZone(shift.endTime, TZ, 'HH:mm');
          const shiftStartMin = toMinutes(shiftStart);
          const shiftEndMin = toMinutes(shiftEnd);

          return dayUnavailable.some((block) => {
            if (!block.startTime || !block.endTime) {
              return true;
            }
            return overlapsTimeRange(
              shiftStartMin,
              shiftEndMin,
              toMinutes(block.startTime),
              toMinutes(block.endTime),
            );
          });
        });

        days.push({
          date: dayStr,
          shifts: dayShifts,
          unavailable: dayUnavailable,
          hasConflict,
        });
      }

      return {
        employee: {
          ...emp,
          hourlyRate: emp.hourlyRate ? Number(emp.hourlyRate) : undefined,
        },
        totalHours: Math.round(totalHours * 10) / 10,
        isOverLimit: totalHours > emp.maxWeeklyHours,
        days,
      };
    });

    return {
      weekStart: format(weekStartLocal, 'yyyy-MM-dd'),
      weekEnd: format(addDays(weekStartLocal, 6), 'yyyy-MM-dd'),
      employees: schedule,
    };
  }

  async getPrintView(weekStartStr: string) {
    const schedule = await this.getWeeklySchedule(weekStartStr);

    // Add business name from config
    return {
      ...schedule,
      businessName: process.env.DEFAULT_BUSINESS_NAME || 'İşletme',
      generatedAt: new Date().toISOString(),
    };
  }
}
