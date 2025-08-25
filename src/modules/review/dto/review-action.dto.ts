import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApprovalStatus } from 'src/utils/types/db.types';

export class ReviewActionDto {
  @IsEnum(ApprovalStatus)
  action: ApprovalStatus;

  @IsString()
  @IsOptional()
  comment?: string;
}
