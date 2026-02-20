import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime } from 'luxon';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private prisma: PrismaService) {}

  async getWeeklySchedule(weekStartStr: string) {
    const weekStart = DateTime.fromISO(weekStartStr, {
      zone: 'Europe/Istanbul',
    }).startOf('week');
    const weekEnd = weekStart.plus({ days: 7 });

    const weekStartUtc = weekStart.toUTC().toJSDate();
    const weekEndUtc = weekEnd.toUTC().toJSDate();

    // Fetch all active employees
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        position: true,
        maxWeeklyHours: true,
        hourlyRate: true,
        user: { select: { name: true } },
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
      const days: Record<string, { shifts: any[]; unavailable: any[] }> = {};
      for (let i = 0; i < 7; i++) {
        const day = weekStart.plus({ days: i });
        const dayStr = day.toFormat('yyyy-MM-dd');
        const dayStartUtc = day.toUTC().toJSDate();
        const dayEndUtc = day.plus({ days: 1 }).toUTC().toJSDate();

        const dayShifts = empShifts
          .filter((s) => s.startTime >= dayStartUtc && s.startTime < dayEndUtc)
          .map((s) => ({
            id: s.id,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            note: (s as any).note,
            status: s.status,
          }));

        const jsDay = day.toJSDate().getDay(); // 0=Sun..6=Sat
        const dayUnavailable = empBlocks
          .filter((b) => b.dayOfWeek === jsDay && b.type === 'UNAVAILABLE')
          .map((b) => ({
            id: b.id,
            dayOfWeek: b.dayOfWeek,
            startTime: b.startTime,
            endTime: b.endTime,
          }));

        days[dayStr] = { shifts: dayShifts, unavailable: dayUnavailable };
      }

      return {
        id: emp.id,
        name: emp.user.name,
        position: emp.position,
        totalHours: Math.round(totalHours * 10) / 10,
        maxWeeklyHours: emp.maxWeeklyHours,
        isOverLimit: totalHours > emp.maxWeeklyHours,
        days,
      };
    });

    return {
      weekStart: weekStart.toFormat('yyyy-MM-dd'),
      weekEnd: weekEnd.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
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
