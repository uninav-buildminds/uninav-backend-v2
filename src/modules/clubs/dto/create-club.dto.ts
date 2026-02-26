import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TransformStringToArray } from 'src/utils/transformers/TransformStringToArray';
import { ClubTargetingEnum } from '@app/common/types/db.types';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  externalLink: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @TransformStringToArray()
  interests: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformStringToArray()
  tags?: string[];

  @IsOptional()
  @IsEnum(ClubTargetingEnum)
  targeting?: ClubTargetingEnum;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @TransformStringToArray()
  targetDepartmentIds?: string[];

  // Set programmatically from req.user in controller
  organizerId: string;
}

export class UpdateClubDto extends PartialType(CreateClubDto) {}
