import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ example: 'employee-uuid' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-02-20T09:00:00+03:00' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-02-20T17:00:00+03:00' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 'kasiyer' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: 'Açılış vardiyası' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ default: false, description: 'Müsaitlik çakışmasını geçersiz kıl' })
  @IsBoolean()
  @IsOptional()
  forceOverride?: boolean;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 'employee-uuid' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ example: '2026-02-20T09:00:00+03:00' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-02-20T17:00:00+03:00' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 'barista' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: 'Not güncellendi' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  forceOverride?: boolean;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CopyWeekDto {
  @ApiProperty({ example: '2026-02-09', description: 'Kaynak hafta başlangıcı (Pazartesi)' })
  @IsDateString()
  sourceWeekStart: string;

  @ApiProperty({ example: '2026-02-16', description: 'Hedef hafta başlangıcı (Pazartesi)' })
  @IsDateString()
  targetWeekStart: string;
}

export class BulkCreateShiftDto {
  @ApiProperty({ type: [CreateShiftDto] })
  shifts: CreateShiftDto[];
}
