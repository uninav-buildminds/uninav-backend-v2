import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { VisibilityEnum } from 'src/utils/types/db.types';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: VisibilityEnum;

  @IsOptional()
  @IsUUID()
  creatorId?: string;
}
