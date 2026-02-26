import { IsEnum, IsNotEmpty } from 'class-validator';
import { ClubStatusEnum } from '@app/common/types/db.types';

export class UpdateClubStatusDto {
  @IsEnum(ClubStatusEnum)
  @IsNotEmpty()
  status: ClubStatusEnum;
}
