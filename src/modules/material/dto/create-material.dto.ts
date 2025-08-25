import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformStringToArray } from 'src/transformers/TransformStringToArray';
import {
  ApprovalStatus,
  MaterialTypeEnum,
  ResourceType,
  RestrictionEnum,
  VisibilityEnum,
} from 'src/utils/types/db.types';

export class ResourceDto {
  @IsOptional()
  @IsString()
  resourceAddress?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaData?: string[];
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

  creatorId: string;
  reviewStatus?: ApprovalStatus;
  reviewedById?: string;
}
