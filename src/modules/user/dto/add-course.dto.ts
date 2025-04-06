import { IsArray, IsString, IsUUID } from 'class-validator';

export class AddCourseDto {
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds: string[];
}
