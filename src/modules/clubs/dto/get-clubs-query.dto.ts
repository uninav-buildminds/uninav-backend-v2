import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@app/common/dto/pagination.dto';
import { ClubStatusEnum } from '@app/common/types/db.types';

export class GetClubsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  interest?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(ClubStatusEnum)
  status?: ClubStatusEnum;

  @IsOptional()
  @IsUUID()
  organizerId?: string;
}
