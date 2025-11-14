import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { VisibilityEnum } from '@app/common/types/db.types';

export class CreateFolderDto {
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
