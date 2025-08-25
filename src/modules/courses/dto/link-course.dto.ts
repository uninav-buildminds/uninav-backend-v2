import { IsIn, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class LinkCourseDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500, 600])
  level: number;
}
