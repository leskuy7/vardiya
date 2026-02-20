import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftsValidator } from './shifts.validator';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftsValidator],
  exports: [ShiftsService],
})
export class ShiftsModule {}
