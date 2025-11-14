import { IsUUID } from 'class-validator';

export class AddMaterialToFolderDto {
  @IsUUID()
  materialId: string;
}
