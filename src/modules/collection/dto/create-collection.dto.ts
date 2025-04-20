import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { VisibilityEnum } from 'src/utils/types/db.types';

export class CreateCollectionDto {
  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(VisibilityEnum)
  @IsOptional()
  visibility?: VisibilityEnum;

  @IsUUID()
  @IsOptional()
  targetCourseId?: string;

  creatorId: string;
}
