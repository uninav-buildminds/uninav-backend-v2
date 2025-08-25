import { IsIn, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { ApprovalStatus } from 'src/utils/types/db.types';

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
  @IsIn([100, 200, 300, 400, 500])
  level: number;

  creatorId: string;
  reviewStatus: ApprovalStatus;
  reviewedById: string;
}
