import { PaginationDto } from '@app/common/dto/pagination.dto';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
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
  advancedSearch?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ignorePreference?: boolean = false; // if to rank materials by user preferences (courses, bookmarks, e.t.c)
}
