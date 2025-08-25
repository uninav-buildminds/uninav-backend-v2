import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from 'src/utils/types/db.types';

export class AuthResponseDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@university.edu',
  })
  email: string;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Student matriculation number',
    example: 'STU/2023/001',
    required: false,
  })
  matricNo?: string;

  @ApiProperty({
    description: 'User ID type',
    example: 'id card',
    required: false,
  })
  userIdType?: string;

  @ApiProperty({
    description: 'User ID image URL',
    example: 'https://storage.example.com/id-images/user123.jpg',
    required: false,
  })
  userIdImage?: string;
}

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'Department unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Computer Science',
  })
  name: string;

  @ApiProperty({
    description: 'Department code',
    example: 'CS',
  })
  code: string;

  @ApiProperty({
    description: 'Department description',
    example: 'Department of Computer Science and Engineering',
    required: false,
  })
  description?: string;
}

export class FacultyResponseDto {
  @ApiProperty({
    description: 'Faculty unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Faculty name',
    example: 'Faculty of Science',
  })
  name: string;

  @ApiProperty({
    description: 'Faculty code',
    example: 'SCI',
  })
  code: string;

  @ApiProperty({
    description: 'Faculty description',
    example: 'Faculty of Science and Technology',
    required: false,
  })
  description?: string;
}

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@university.edu',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe2023',
  })
  username: string;

  @ApiProperty({
    description: 'User academic level',
    example: 300,
    enum: [100, 200, 300, 400, 500, 600],
  })
  level: number;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRoleEnum,
    example: UserRoleEnum.STUDENT,
  })
  role: UserRoleEnum;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://storage.example.com/avatars/user123.jpg',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'User bio/description',
    example:
      'Computer Science student passionate about AI and machine learning.',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'User department information',
    type: DepartmentResponseDto,
    required: false,
  })
  department?: DepartmentResponseDto;

  @ApiProperty({
    description: 'User authentication details',
    type: AuthResponseDto,
  })
  auth: AuthResponseDto;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2023-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-20T14:45:00Z',
  })
  updatedAt: string;
}

export class CourseResponseDto {
  @ApiProperty({
    description: 'Course unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Course title',
    example: 'Introduction to Computer Science',
  })
  title: string;

  @ApiProperty({
    description: 'Course code',
    example: 'CS101',
  })
  courseCode: string;

  @ApiProperty({
    description: 'Course description',
    example:
      'An introductory course covering fundamental concepts in computer science.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Course credit units',
    example: 3,
  })
  creditUnits: number;

  @ApiProperty({
    description: 'Course academic level',
    example: 100,
    enum: [100, 200, 300, 400, 500, 600],
  })
  level: number;
}
