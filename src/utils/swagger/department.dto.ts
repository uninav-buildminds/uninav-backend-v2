import { ApiProperty } from '@nestjs/swagger';
import { FacultyDto } from 'src/utils/swagger/faculty.dto';

export class DepartmentDto {
  @ApiProperty({
    description: 'The name of the department',
    example: 'Department of Computer Science',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the department',
    example:
      'The department of computer science is a department that studies computer science',
  })
  description: string;

  @ApiProperty({
    description: 'Faculty ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  facultyId: string;
}
