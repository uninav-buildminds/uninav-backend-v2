import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class BatchFindMaterialsDto {
  @IsArray()
  @IsNotEmpty({ message: 'Material IDs array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one material ID is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 material IDs allowed per batch' })
  @IsString({ each: true, message: 'Each material ID must be a string' })
  @Transform(({ value }) => {
    // Handle both single string and array of strings from query parameters
    if (typeof value === 'string') {
      return value.split(',').map((id) => id.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  @Type(() => String)
  materialIds: string[];

  @IsOptional()
  @IsString()
  userId?: string; // Optional user ID for tracking views
}
