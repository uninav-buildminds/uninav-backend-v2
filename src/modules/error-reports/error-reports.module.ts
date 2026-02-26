import { Module } from '@nestjs/common';
import { ErrorReportsController } from './error-reports.controller';
import { ErrorReportsService } from './error-reports.service';
import { ErrorReportsRepository } from './error-reports.repository';
import { DatabaseModule } from '@app/common/modules/database';

@Module({
  imports: [DatabaseModule],
  controllers: [ErrorReportsController],
  providers: [ErrorReportsService, ErrorReportsRepository],
  exports: [ErrorReportsService], // Export service for use in other modules
})
export class ErrorReportsModule {}
