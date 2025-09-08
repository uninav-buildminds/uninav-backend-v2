import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ResourceType } from '@app/common/types/db.types';

export class CreateResourceDto {
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
