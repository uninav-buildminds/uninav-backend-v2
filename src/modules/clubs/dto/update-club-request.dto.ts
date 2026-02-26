import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ClubRequestAction {
  FULFILLED = 'fulfilled',
  DISMISSED = 'dismissed',
}

export class UpdateClubRequestDto {
  @IsEnum(ClubRequestAction)
  @IsNotEmpty()
  status: ClubRequestAction;
}
