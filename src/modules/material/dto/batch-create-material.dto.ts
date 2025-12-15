import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformStringToArray } from 'src/utils/transformers/TransformStringToArray';
import {
  MaterialTypeEnum,
  RestrictionEnum,
  VisibilityEnum,
} from '@app/common/types/db.types';

/**
 * Single material item in a batch upload request (for links only)
 */
export class BatchMaterialItemDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(MaterialTypeEnum)
  type: MaterialTypeEnum;

  @IsNotEmpty()
  @IsString()
  resourceAddress: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: VisibilityEnum;

  @IsOptional()
  @IsEnum(RestrictionEnum)
  restriction?: RestrictionEnum;

  @IsOptional()
  @IsUUID()
  targetCourseId?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsObject()
  metaData?: Record<string, any>;
}

/**
 * DTO for batch creating materials (links only - files are uploaded sequentially)
 */
export class BatchCreateMaterialsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one material is required' })
  @Type(() => BatchMaterialItemDto)
  materials: BatchMaterialItemDto[];
}

/**
 * Response for individual material in batch creation
 */
export interface BatchMaterialResult {
  index: number;
  success: boolean;
  materialId?: string;
  label: string;
  error?: string;
}

/**
 * Response for batch material creation
 */
export interface BatchCreateMaterialsResponse {
  totalRequested: number;
  totalSucceeded: number;
  totalFailed: number;
  results: BatchMaterialResult[];
}
