import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FacultyEntity } from '@app/common/types/db.types';

export class CreateFacultyDto implements Omit<FacultyEntity, 'id'> {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  description: string;
}
