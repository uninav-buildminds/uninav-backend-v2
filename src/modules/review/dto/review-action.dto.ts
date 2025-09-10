import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApprovalStatus } from '@app/common/types/db.types';

export class ReviewActionDto {
  @IsEnum(ApprovalStatus)
  action: ApprovalStatus;

  @IsString()
  @IsOptional()
  comment?: string;
}
