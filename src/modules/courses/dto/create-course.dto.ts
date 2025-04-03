import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @IsString()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsNumber()
  @Min(1)
  level: number;
}
