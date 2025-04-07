import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { blogTypeEnum } from 'src/modules/drizzle/schema/enums.schema';

export class CreateBlogDto {
  @IsUUID()
  @IsOptional()
  creator?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(blogTypeEnum)
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  body: string; // This will be stored in B2 storage, not directly in DB

  @IsArray()
  @IsOptional()
  tags?: string[];
}
