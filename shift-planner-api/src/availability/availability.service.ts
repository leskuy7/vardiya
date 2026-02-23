import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private prisma: PrismaService) { }

  async findAll(filters: { employeeId?: string; dayOfWeek?: number }) {
    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.dayOfWeek !== undefined) where.dayOfWeek = filters.dayOfWeek;

    return this.prisma.availabilityBlock.findMany({
      where,
      include: {
        employee: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async create(dto: CreateAvailabilityDto, employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException({
        code: 'EMPLOYEE_REQUIRED',
        message: 'Müsaitlik için çalışan seçimi zorunludur',
      });
    }

    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException({
        code: 'INVALID_TIME_RANGE',
        message: 'Bitiş saati başlangıç saatinden sonra olmalıdır',
      });
    }

    // Convert HH:mm strings to Date objects for @db.Time()
    const toTime = (hhmm: string | undefined): Date | null => {
      if (!hhmm) return null;
      const [h, m] = hhmm.split(':').map(Number);
      return new Date(Date.UTC(1970, 0, 1, h, m, 0));
    };
    // Convert YYYY-MM-DD strings to Date objects for @db.Date
    const toDate = (ymd: string | undefined): Date | null => {
      if (!ymd) return null;
      return new Date(ymd + 'T00:00:00.000Z');
    };

    const block = await this.prisma.availabilityBlock.create({
      data: {
        employeeId,
        type: dto.type,
        dayOfWeek: dto.dayOfWeek,
        startTime: toTime(dto.startTime),
        endTime: toTime(dto.endTime),
        startDate: toDate(dto.startDate),
        endDate: toDate(dto.endDate),
        note: dto.note || null,
      },
      include: {
        employee: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
    });

    this.logger.log(
      `Availability block created: ${block.id} for employee ${employeeId}`,
    );

    return block;
  }

  async remove(id: string, employeeId: string, userRole: string) {
    const block = await this.prisma.availabilityBlock.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException({
        code: 'AVAILABILITY_NOT_FOUND',
        message: 'Müsaitlik bloğu bulunamadı',
      });
    }

    // Only owner, admin, or manager can delete
    if (
      block.employeeId !== employeeId &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER'
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu müsaitlik bloğunu silme yetkiniz yok',
      });
    }

    await this.prisma.availabilityBlock.delete({ where: { id } });

    this.logger.log(`Availability block deleted: ${id}`);
    return { message: 'Müsaitlik bloğu silindi' };
  }
}
