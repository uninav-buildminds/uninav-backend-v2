import { ApiProperty } from '@nestjs/swagger';
import {
  MaterialTypeEnum,
  VisibilityEnum,
  RestrictionEnum,
  ApprovalStatus,
} from 'src/utils/types/db.types';
import { UserProfileResponseDto, CourseResponseDto } from './user.dto';

export class ResourceResponseDto {
  @ApiProperty({
    description: 'Resource unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Resource file address/URL',
    example: 'https://storage.example.com/materials/document.pdf',
    required: false,
  })
  resourceAddress?: string;

  @ApiProperty({
    description: 'Resource metadata',
    type: [String],
    example: ['pdf', '2.5MB', 'document'],
    required: false,
  })
  metaData?: string[];
}

export class MaterialResponseDto {
  @ApiProperty({
    description: 'Material unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Material label/title',
    example: 'Introduction to Algorithms - Lecture Notes',
  })
  label: string;

  @ApiProperty({
    description: 'Material description',
    example:
      'Comprehensive lecture notes covering basic algorithms and data structures.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Material type',
    enum: MaterialTypeEnum,
    example: MaterialTypeEnum.PDF,
  })
  type: MaterialTypeEnum;

  @ApiProperty({
    description: 'Material tags',
    type: [String],
    example: ['algorithms', 'data-structures', 'computer-science'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Material visibility setting',
    enum: VisibilityEnum,
    example: VisibilityEnum.PUBLIC,
    required: false,
  })
  visibility?: VisibilityEnum;

  @ApiProperty({
    description: 'Material access restriction',
    enum: RestrictionEnum,
    example: RestrictionEnum.DOWNLOADABLE,
    required: false,
  })
  restriction?: RestrictionEnum;

  @ApiProperty({
    description: 'Number of downloads',
    example: 150,
  })
  downloads: number;

  @ApiProperty({
    description: 'Number of likes',
    example: 25,
  })
  likes: number;

  @ApiProperty({
    description: 'Review status',
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED,
  })
  reviewStatus: ApprovalStatus;

  @ApiProperty({
    description: 'Material creator information',
    type: () => UserProfileResponseDto,
  })
  creator: UserProfileResponseDto;

  @ApiProperty({
    description: 'Target course information',
    type: () => CourseResponseDto,
    required: false,
  })
  targetCourse?: CourseResponseDto;

  @ApiProperty({
    description: 'Associated resource',
    type: ResourceResponseDto,
    required: false,
  })
  resource?: ResourceResponseDto;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-20T14:45:00Z',
  })
  updatedAt: string;
}

export class CollectionResponseDto {
  @ApiProperty({
    description: 'Collection unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Collection name',
    example: 'CS 101 Study Materials',
  })
  name: string;

  @ApiProperty({
    description: 'Collection description',
    example:
      'A curated collection of study materials for Computer Science 101.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Collection visibility setting',
    enum: VisibilityEnum,
    example: VisibilityEnum.PUBLIC,
  })
  visibility: VisibilityEnum;

  @ApiProperty({
    description: 'Collection creator information',
    type: () => UserProfileResponseDto,
  })
  creator: UserProfileResponseDto;

  @ApiProperty({
    description: 'Materials in this collection',
    type: [MaterialResponseDto],
    required: false,
  })
  materials?: MaterialResponseDto[];

  @ApiProperty({
    description: 'Nested collections',
    type: [CollectionResponseDto],
    required: false,
  })
  collections?: CollectionResponseDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-20T14:45:00Z',
  })
  updatedAt: string;
}
