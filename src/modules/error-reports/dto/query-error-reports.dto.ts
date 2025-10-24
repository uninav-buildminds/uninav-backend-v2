import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { ErrorSeverity, ErrorStatus } from './create-error-report.dto';

export class QueryErrorReportsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  query?: string; // Search in title and description

  @IsOptional()
  @IsString()
  errorType?: string;

  @IsOptional()
  @IsEnum(ErrorSeverity)
  severity?: ErrorSeverity;

  @IsOptional()
  @IsEnum(ErrorStatus)
  status?: ErrorStatus;

  @IsOptional()
  @IsString()
  userId?: string; // Filter by user who reported

  @IsOptional()
  @IsString()
  resolvedBy?: string; // Filter by who resolved
}
