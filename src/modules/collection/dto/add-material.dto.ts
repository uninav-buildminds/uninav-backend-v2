import { IsUUID } from 'class-validator';

export class AddMaterialToCollectionDto {
  @IsUUID()
  materialId: string;
}
