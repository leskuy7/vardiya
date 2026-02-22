import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AvailabilityType {
  UNAVAILABLE = 'UNAVAILABLE',
  PREFER_NOT = 'PREFER_NOT',
  AVAILABLE_ONLY = 'AVAILABLE_ONLY',
}

export class CreateAvailabilityDto {
  @ApiPropertyOptional({ example: 'employee-uuid' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ enum: AvailabilityType, example: AvailabilityType.UNAVAILABLE })
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  @ApiProperty({ example: 1, description: '0=Pazar, 1=Pazartesi, ..., 6=Cumartesi' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiPropertyOptional({ example: '09:00', description: 'HH:mm formatında başlangıç saati' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime HH:mm formatında olmalıdır' })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'HH:mm formatında bitiş saati' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime HH:mm formatında olmalıdır' })
  endTime?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Opsiyonel başlangıç tarihi (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Opsiyonel bitiş tarihi (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Doktor randevusu' })
  @IsString()
  @IsOptional()
  note?: string;
}
