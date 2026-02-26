import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUrl,
} from 'class-validator';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class CreateErrorReportDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  errorType: string; // e.g., 'upload_failure', 'api_error', 'ui_bug'

  @IsOptional()
  @IsEnum(ErrorSeverity)
  severity?: ErrorSeverity;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // Additional context data

  @IsOptional()
  @IsObject()
  errorDetails?: Record<string, any>; // Stack trace, error message, etc.

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  url?: string; // URL where error occurred

  // These will be set by the service
  userId?: string; // Optional - can be null for anonymous reports
}
