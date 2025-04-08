import { IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class AddBookmarkDto {
  @ValidateIf((o) => !o.collectionId)
  @IsUUID('4')
  materialId?: string;

  @ValidateIf((o) => !o.materialId)
  @IsUUID('4')
  collectionId?: string;
}
