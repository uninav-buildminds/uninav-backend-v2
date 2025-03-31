import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddMaterialToCollectionDto {
  @IsNotEmpty()
  @IsUUID()
  materialId: string;
}
