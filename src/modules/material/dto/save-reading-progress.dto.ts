import {
  IsOptional,
  IsInt,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class SaveReadingProgressDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  currentPage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @IsOptional()
  @IsString()
  currentFilePath?: string;

  @IsOptional()
  @IsString()
  currentFileId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scrollPosition?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  progressPercentage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalReadingTime?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
