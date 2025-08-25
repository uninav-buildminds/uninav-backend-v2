import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransformStringToArray } from 'src/transformers/TransformStringToArray';
import {
  ApprovalStatus,
  MaterialTypeEnum,
  ResourceType,
  RestrictionEnum,
  VisibilityEnum,
} from 'src/utils/types/db.types';

export class ResourceDto {
  @ApiProperty({
    description: 'Resource file address or URL',
    example: 'https://storage.example.com/materials/document.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  resourceAddress?: string;

  @ApiProperty({
    description: 'Resource metadata',
    type: [String],
    example: ['pdf', '2.5MB', 'document'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaData?: string[];
}

export class CreateMaterialDto extends ResourceDto {
  @ApiProperty({
    description: 'Material label/title',
    example: 'Introduction to Algorithms - Lecture Notes',
  })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Material description',
    example:
      'Comprehensive lecture notes covering basic algorithms and data structures.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Material type',
    enum: MaterialTypeEnum,
    example: MaterialTypeEnum.IMAGE,
  })
  @IsNotEmpty()
  @IsEnum(MaterialTypeEnum)
  type: MaterialTypeEnum;

  @ApiProperty({
    description: 'Material tags for categorization',
    type: [String],
    example: ['algorithms', 'data-structures', 'computer-science'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformStringToArray()
  tags?: string[];

  @ApiProperty({
    description: 'Material visibility setting',
    enum: VisibilityEnum,
    example: VisibilityEnum.PUBLIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: VisibilityEnum;

  @ApiProperty({
    description: 'Material access restriction',
    enum: RestrictionEnum,
    example: RestrictionEnum.DOWNLOADABLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(RestrictionEnum)
  restriction?: RestrictionEnum;

  @ApiProperty({
    description: 'Target course ID for course-specific materials',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  targetCourseId?: string;

  creatorId: string;
  reviewStatus?: ApprovalStatus;
  reviewedById?: string;
}
