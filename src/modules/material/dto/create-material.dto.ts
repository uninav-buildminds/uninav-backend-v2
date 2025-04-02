import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  MaterialTypeEnum,
  ResourceType,
  RestrictionEnum,
  VisibilityEnum,
} from 'src/utils/types/db.types';

export class ResourceDto {
  @IsNotEmpty()
  @IsEnum(ResourceType)
  resourceType: ResourceType;

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
  tags?: string[];

  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: VisibilityEnum;

  @IsOptional()
  @IsEnum(RestrictionEnum)
  restriction?: RestrictionEnum;

  creatorId: string;
}
