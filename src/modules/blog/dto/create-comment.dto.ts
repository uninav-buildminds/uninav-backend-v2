import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'User ID of the commenter (auto-populated from auth)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Blog post ID to comment on',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  blogId: string;

  @ApiProperty({
    description: 'Comment text content',
    example: 'Great article! Very informative and well-written.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
