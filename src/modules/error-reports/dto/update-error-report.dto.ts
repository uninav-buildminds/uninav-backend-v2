import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ErrorStatus } from './create-error-report.dto';

export class UpdateErrorReportDto {
  @IsOptional()
  @IsEnum(ErrorStatus)
  status?: ErrorStatus;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  // These will be set by the service
  resolvedBy?: string;
  resolvedAt?: Date;
}
