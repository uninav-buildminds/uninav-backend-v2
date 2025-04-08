import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AdvertTypeEnum } from 'src/utils/types/db.types';
export class CreateFreeAdvertDto {
  type: AdvertTypeEnum.FREE;
  amount: number = 0;

  @IsUUID()
  @IsOptional()
  materialId: string;

  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  description?: string;
}
