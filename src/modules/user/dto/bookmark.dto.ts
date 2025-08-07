import { IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddBookmarkDto {
  @ApiProperty({
    description:
      'Material ID to bookmark (required if collectionId is not provided)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ValidateIf((o) => !o.collectionId)
  @IsUUID('4')
  materialId?: string;

  @ApiProperty({
    description:
      'Collection ID to bookmark (required if materialId is not provided)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @ValidateIf((o) => !o.materialId)
  @IsUUID('4')
  collectionId?: string;
}
