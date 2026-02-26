import { IsNotEmpty, IsString } from 'class-validator';

export class FlagClubDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  // Set programmatically in controller
  reporterId: string;
  clubId: string;
}
