import { Inject, Injectable } from '@nestjs/common';
import { department } from '@app/common/modules/database/schema/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DepartmentEntity, DrizzleDB } from '@app/common/types/db.types';
import { eq } from 'drizzle-orm';

@Injectable()
export class DepartmentRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const result = await this.db
      .insert(department)
      .values(createDepartmentDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<DepartmentEntity[]> {
    return this.db.query.department.findMany({
      with: {
        faculty: true,
      },
    });
  }

  async findOne(id: string): Promise<DepartmentEntity> {
    return this.db.query.department.findFirst({
      where: eq(department.id, id),
      with: {
        faculty: true,
      },
    });
  }

  async findByName(name: string): Promise<DepartmentEntity> {
    return this.db.query.department.findFirst({
      where: eq(department.name, name),
    });
  }

  async findByFaculty(facultyId: string): Promise<DepartmentEntity[]> {
    return this.db.query.department.findMany({
      where: eq(department.facultyId, facultyId),
    });
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const result = await this.db
      .update(department)
      .set(updateDepartmentDto)
      .where(eq(department.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<DepartmentEntity> {
    const result = await this.db
      .delete(department)
      .where(eq(department.id, id))
      .returning();
    return result[0];
  }
}
