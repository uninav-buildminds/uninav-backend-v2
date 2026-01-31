import { PaginationDto } from '@app/common/dto/pagination.dto';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MaterialTypeEnum, ApprovalStatus } from '@app/common/types/db.types';

export class MaterialQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsEnum(MaterialTypeEnum)
  type?: MaterialTypeEnum;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  reviewStatus?: ApprovalStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ignorePreference?: boolean = false; // if to rank materials by user preferences (courses, bookmarks, e.t.c)

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  advancedSearch?: boolean; // Force advanced search (for specific use cases like recommendations)

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    // Handle comma-separated string or array
    if (typeof value === 'string') {
      // Filter out empty strings, 'undefined', 'null' etc.
      const ids = value
        .split(',')
        .filter(
          (id) =>
            id.trim() && id.trim() !== 'undefined' && id.trim() !== 'null',
        );
      return ids.length > 0 ? ids : undefined;
    }
    if (Array.isArray(value)) {
      // Filter out invalid values
      const validIds = value.filter(
        (id) =>
          id &&
          typeof id === 'string' &&
          id.trim() &&
          id.trim() !== 'undefined' &&
          id.trim() !== 'null',
      );
      return validIds.length > 0 ? validIds : undefined;
    }
    return undefined;
  })
  excludeIds?: string[]; // Material IDs to exclude from search results (sent by client to avoid duplicates)
}
