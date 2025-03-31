import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentRepository } from './department.repository';
import { DepartmentEntity } from 'src/utils/types/db.types';
import { FacultyService } from 'src/modules/faculty/faculty.service';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly facultyService: FacultyService,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    // Check if department with the same name already exists
    const existingDepartment = await this.departmentRepository.findByName(
      createDepartmentDto.name,
    );
    if (existingDepartment) {
      throw new BadRequestException('Department with this name already exists');
    }

    // Verify that the faculty exists
    try {
      await this.facultyService.findOne(createDepartmentDto.facultyId);
    } catch (error) {
      throw new BadRequestException(
        `Faculty with ID ${createDepartmentDto.facultyId} does not exist`,
      );
    }

    return this.departmentRepository.create(createDepartmentDto);
  }

  async findAll(): Promise<DepartmentEntity[]> {
    return this.departmentRepository.findAll();
  }

  async findOne(id: string): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findOne(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async findByFaculty(facultyId: string): Promise<DepartmentEntity[]> {
    // Verify that the faculty exists
    await this.facultyService.findOne(facultyId);

    return this.departmentRepository.findByFaculty(facultyId);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    // Check if department exists
    await this.findOne(id);

    // Check if updating name and the name already exists
    if (updateDepartmentDto.name) {
      const existingDepartment = await this.departmentRepository.findByName(
        updateDepartmentDto.name,
      );
      if (existingDepartment && existingDepartment.id !== id) {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
    }

    // Verify that the faculty exists if updating faculty
    if (updateDepartmentDto.facultyId) {
      await this.facultyService.findOne(updateDepartmentDto.facultyId);
    }

    return this.departmentRepository.update(id, updateDepartmentDto);
  }

  async remove(id: string): Promise<DepartmentEntity> {
    // Check if department exists
    await this.findOne(id);

    return this.departmentRepository.remove(id);
  }
}
