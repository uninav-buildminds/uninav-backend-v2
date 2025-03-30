import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FacultyEntity } from 'src/utils/types/db.types';

export class CreateFacultyDto implements Omit<FacultyEntity, 'id'> {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  description: string;
}
