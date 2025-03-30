import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { DepartmentEntity } from 'src/utils/types/db.types';

export class CreateDepartmentDto implements Omit<DepartmentEntity, 'id'> {
  @IsNotEmpty()
  @IsString()
  name: string;
  k;
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUUID()
  facultyId: string;
}
