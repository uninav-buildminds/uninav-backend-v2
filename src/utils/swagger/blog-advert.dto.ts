import { ApiProperty } from '@nestjs/swagger';
import {
  BlogTypeEnum,
  ApprovalStatus,
  AdvertTypeEnum,
} from 'src/utils/types/db.types';
import { UserProfileResponseDto } from './user.dto';
import { PaginatedResponseDto } from './response.dto';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Comment unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'Great article! Very informative and well-written.',
  })
  content: string;

  @ApiProperty({
    description: 'Comment author information',
    type: () => UserProfileResponseDto,
  })
  commenter: UserProfileResponseDto;

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

export class BlogResponseDto {
  @ApiProperty({
    description: 'Blog post unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Blog post title',
    example: 'The Future of Education Technology',
  })
  title: string;

  @ApiProperty({
    description: 'Blog post content',
    example:
      'In this article, we explore the emerging trends in educational technology...',
  })
  content: string;

  @ApiProperty({
    description: 'Blog post excerpt/summary',
    example: 'A comprehensive look at how technology is reshaping education.',
    required: false,
  })
  excerpt?: string;

  @ApiProperty({
    description: 'Blog post type',
    enum: BlogTypeEnum,
    example: BlogTypeEnum.ARTICLE,
  })
  type: BlogTypeEnum;

  @ApiProperty({
    description: 'Blog post tags',
    type: [String],
    example: ['education', 'technology', 'innovation'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Number of likes',
    example: 45,
  })
  likes: number;

  @ApiProperty({
    description: 'Number of views',
    example: 1250,
  })
  views: number;

  @ApiProperty({
    description: 'Review status',
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED,
  })
  reviewStatus: ApprovalStatus;

  @ApiProperty({
    description: 'Heading image URL',
    example: 'https://storage.example.com/blog-images/tech-education.jpg',
    required: false,
  })
  headingImage?: string;

  @ApiProperty({
    description: 'Blog post author information',
    type: () => UserProfileResponseDto,
  })
  creator: UserProfileResponseDto;

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

export class BlogDetailsResponseDto extends BlogResponseDto {
  @ApiProperty({
    description: 'Blog post comments',
    type: [CommentResponseDto],
    required: false,
  })
  comments?: CommentResponseDto[];
}

export class PaginatedBlogsResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Blogs retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Paginated blog data',
  })
  data: {
    items: BlogResponseDto[];
    meta: any;
  };
}

export class AdvertResponseDto {
  @ApiProperty({
    description: 'Advertisement unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Advertisement title',
    example: 'Study Group Formation',
  })
  title: string;

  @ApiProperty({
    description: 'Advertisement description',
    example:
      'Looking for students to join our CS 101 study group. Meeting every Tuesday and Thursday.',
  })
  description: string;

  @ApiProperty({
    description: 'Advertisement type',
    enum: AdvertTypeEnum,
    example: AdvertTypeEnum.FREE,
  })
  type: AdvertTypeEnum;

  @ApiProperty({
    description: 'Advertisement amount (for paid ads)',
    example: 0,
  })
  amount: number;

  @ApiProperty({
    description: 'Contact information',
    example: 'contact@example.com or WhatsApp: +234-xxx-xxx-xxxx',
    required: false,
  })
  contactInfo?: string;

  @ApiProperty({
    description: 'Number of views',
    example: 125,
  })
  views: number;

  @ApiProperty({
    description: 'Number of clicks',
    example: 25,
  })
  clicks: number;

  @ApiProperty({
    description: 'Review status',
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED,
  })
  reviewStatus: ApprovalStatus;

  @ApiProperty({
    description: 'Advertisement image URL',
    example: 'https://storage.example.com/ad-images/study-group.jpg',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Advertisement creator information',
    type: () => UserProfileResponseDto,
  })
  creator: UserProfileResponseDto;

  @ApiProperty({
    description: 'Expiration date',
    example: '2023-02-15T23:59:59Z',
    required: false,
  })
  expiresAt?: string;

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

export class PaginatedAdvertsResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Advertisements retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Paginated advertisement data',
  })
  data: {
    items: AdvertResponseDto[];
    meta: any;
  };
}
