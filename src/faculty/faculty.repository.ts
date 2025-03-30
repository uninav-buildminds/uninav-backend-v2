import { Inject, Injectable } from '@nestjs/common';
import { faculty } from 'src/drizzle/schema/faculty.schema';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB, FacultyEntity } from 'src/utils/types/db.types';
import { eq } from 'drizzle-orm';

@Injectable()
export class FacultyRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createFacultyDto: CreateFacultyDto): Promise<FacultyEntity> {
    const result = await this.db
      .insert(faculty)
      .values(createFacultyDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<FacultyEntity[]> {
    return this.db.query.faculty.findMany({
      with: {
        departments: true,
      },
    });
  }

  async findOne(id: string): Promise<FacultyEntity> {
    return this.db.query.faculty.findFirst({
      where: eq(faculty.id, id),
      with: {
        departments: true,
      },
    });
  }

  async findByName(name: string): Promise<FacultyEntity> {
    return this.db.query.faculty.findFirst({
      where: eq(faculty.name, name),
    });
  }

  async update(
    id: string,
    updateFacultyDto: UpdateFacultyDto,
  ): Promise<FacultyEntity> {
    const result = await this.db
      .update(faculty)
      .set(updateFacultyDto)
      .where(eq(faculty.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<FacultyEntity> {
    const result = await this.db
      .delete(faculty)
      .where(eq(faculty.id, id))
      .returning();
    return result[0];
  }
}
