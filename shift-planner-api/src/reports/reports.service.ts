import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime } from 'luxon';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly OVERTIME_MULTIPLIER = 1.5;

  constructor(private prisma: PrismaService) {}

  async getWeeklyHoursReport(weekStartStr: string) {
    const weekStart = DateTime.fromISO(weekStartStr, {
      zone: 'Europe/Istanbul',
    }).startOf('week');
    const weekEnd = weekStart.plus({ days: 7 });

    const weekStartUtc = weekStart.toUTC().toJSDate();
    const weekEndUtc = weekEnd.toUTC().toJSDate();

    const employees = await this.prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        position: true,
        hourlyRate: true,
        maxWeeklyHours: true,
        user: { select: { name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const shifts = await this.prisma.shift.findMany({
      where: {
        startTime: { gte: weekStartUtc },
        endTime: { lte: weekEndUtc },
        status: { not: 'CANCELLED' },
      },
    });

    let totalCost = 0;

    const report = employees.map((emp) => {
      const empShifts = shifts.filter((s) => s.employeeId === emp.id);

      const totalHours = empShifts.reduce((sum, s) => {
        return (
          sum +
          (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
        );
      }, 0);

      const regularHours = Math.min(totalHours, emp.maxWeeklyHours);
      const overtimeHours = Math.max(0, totalHours - emp.maxWeeklyHours);

      const hourlyRate = emp.hourlyRate
        ? Number(emp.hourlyRate)
        : 0;

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * this.OVERTIME_MULTIPLIER;
      const totalPay = regularPay + overtimePay;

      totalCost += totalPay;

      return {
        id: emp.id,
        name: emp.user.name,
        position: emp.position,
        totalHours: Math.round(totalHours * 10) / 10,
        regularHours: Math.round(regularHours * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        hourlyRate,
        regularPay: Math.round(regularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        shiftCount: empShifts.length,
      };
    });

    return {
      weekStart: weekStart.toFormat('yyyy-MM-dd'),
      weekEnd: weekEnd.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
      employees: report,
      totalCost: Math.round(totalCost * 100) / 100,
      totalShifts: shifts.length,
    };
  }
}
