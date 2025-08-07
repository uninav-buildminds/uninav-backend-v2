import { CreateUserDto } from './create-user.dto';
import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email']),
) {
  @ApiProperty({
    description: 'Google OAuth ID',
    example: 'google-oauth-id-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  googleId?: string;
}
