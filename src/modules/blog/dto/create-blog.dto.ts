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
import { BlogTypeEnum } from 'src/utils/types/db.types';

export class CreateBlogDto {
  @ApiProperty({
    description: 'Blog post title',
    example: 'The Future of Education Technology',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Blog post description/excerpt',
    example: 'A comprehensive look at how technology is reshaping education.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Blog post type',
    enum: BlogTypeEnum,
    example: BlogTypeEnum.ARTICLE,
  })
  @IsEnum(BlogTypeEnum)
  @IsNotEmpty()
  type: BlogTypeEnum;

  @ApiProperty({
    description: 'Blog post content body',
    example:
      'In this article, we explore the emerging trends in educational technology and their impact on learning...',
  })
  @IsString()
  @IsNotEmpty()
  body: string; // This will be stored in B2 storage, not directly in DB

  @ApiProperty({
    description: 'Blog post tags for categorization',
    type: [String],
    example: ['education', 'technology', 'innovation'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformStringToArray()
  tags?: string[];

  creatorId: string;
}
