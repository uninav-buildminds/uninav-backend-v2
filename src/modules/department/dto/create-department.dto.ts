import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { DepartmentEntity } from '@app/common/types/db.types';

export class CreateDepartmentDto implements Omit<DepartmentEntity, 'id'> {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUUID()
  facultyId: string;
}
