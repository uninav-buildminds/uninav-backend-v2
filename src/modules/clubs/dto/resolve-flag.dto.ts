import { IsEnum, IsNotEmpty } from 'class-validator';

export enum FlagAction {
  APPROVE = 'approve',
  HIDE = 'hide',
  DISMISS = 'dismiss',
}

export class ResolveFlagDto {
  @IsEnum(FlagAction)
  @IsNotEmpty()
  action: FlagAction;
}
