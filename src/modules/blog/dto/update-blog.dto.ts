import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { blogTypeEnum } from 'src/modules/drizzle/schema/enums.schema';
import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogDto } from './create-blog.dto';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(blogTypeEnum)
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  body?: string; // This will be stored in B2 storage, not directly in DB

  @IsArray()
  @IsOptional()
  tags?: string[];
}
