import { IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class AddBookmarkDto {
  @ValidateIf((o) => !o.folderId)
  @IsUUID('4')
  materialId?: string;

  @ValidateIf((o) => !o.materialId)
  @IsUUID('4')
  folderId?: string;
}
