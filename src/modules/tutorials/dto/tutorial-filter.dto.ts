import { IsOptional, IsString, IsNumber, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TutorialFilterDto {
  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([100, 200, 300, 400, 500, 600, 700])
  level?: number;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
