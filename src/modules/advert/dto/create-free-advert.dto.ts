import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AdvertTypeEnum } from 'src/utils/types/db.types';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFreeAdvertDto {
  @IsUUID()
  @IsOptional()
  materialId?: string;

  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  description?: string;

  creatorId: string;
  type: AdvertTypeEnum.FREE;
  amount: number;
}

export class UpdateAdvertDto extends PartialType(CreateFreeAdvertDto) {}
