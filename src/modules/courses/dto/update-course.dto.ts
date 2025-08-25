import { IsString, IsOptional } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  courseName?: string;

  @IsString()
  @IsOptional()
  courseCode?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
