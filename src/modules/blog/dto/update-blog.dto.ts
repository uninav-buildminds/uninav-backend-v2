import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogDto } from './create-blog.dto';
import { BlogTypeEnum } from 'src/utils/types/db.types';
import { TransformStringToArray } from 'src/utils/transformers/TransformStringToArray';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BlogTypeEnum)
  @IsOptional()
  type?: BlogTypeEnum;

  @IsString()
  @IsOptional()
  body?: string; // This will be stored in B2 storage, not directly in DB

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformStringToArray()
  tags?: string[];
}
