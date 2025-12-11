import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformStringToArray } from 'src/utils/transformers/TransformStringToArray';
import {
  ApprovalStatus,
  MaterialTypeEnum,
  ResourceType,
  RestrictionEnum,
  VisibilityEnum,
} from '@app/common/types/db.types';

export class ResourceDto {
  @IsOptional()
  @IsString()
  resourceAddress?: string;

  @IsOptional()
  metaData?: Object;
}

export class CreateMaterialDto extends ResourceDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(MaterialTypeEnum)
  type: MaterialTypeEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformStringToArray()
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
  @IsString()
  previewUrl?: string;

  creatorId: string;
  reviewStatus?: ApprovalStatus;
  reviewedById?: string;
}
