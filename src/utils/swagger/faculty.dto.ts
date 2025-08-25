import { ApiProperty } from '@nestjs/swagger';
import { DepartmentDto } from './department.dto';

export class FacultyDto {
  @ApiProperty({
    description: 'The name of the faculty',
    example: 'Faculty of Science',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the faculty',
    example: 'The faculty of science is a faculty that studies science',
  })
  description: string;

  @ApiProperty({
    description: 'The departments of the faculty',
    example: ['Department of Computer Science', 'Department of Mathematics'],
  })
  departments: DepartmentDto[];
}
