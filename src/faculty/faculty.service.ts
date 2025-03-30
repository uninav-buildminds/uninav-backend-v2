import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { FacultyRepository } from './faculty.repository';
import { FacultyEntity } from 'src/utils/types/db.types';

@Injectable()
export class FacultyService {
  constructor(private readonly facultyRepository: FacultyRepository) {}

  async create(createFacultyDto: CreateFacultyDto): Promise<FacultyEntity> {
    // Check if faculty with the same name already exists
    const existingFaculty = await this.facultyRepository.findByName(
      createFacultyDto.name,
    );
    if (existingFaculty) {
      throw new BadRequestException('Faculty with this name already exists');
    }
    return this.facultyRepository.create(createFacultyDto);
  }

  async findAll(): Promise<FacultyEntity[]> {
    return this.facultyRepository.findAll();
  }

  async findOne(id: string): Promise<FacultyEntity> {
    const faculty = await this.facultyRepository.findOne(id);
    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }
    return faculty;
  }

  async update(
    id: string,
    updateFacultyDto: UpdateFacultyDto,
  ): Promise<FacultyEntity> {
    // Check if faculty exists
    await this.findOne(id);

    // Check if updating name and the name already exists
    if (updateFacultyDto.name) {
      const existingFaculty = await this.facultyRepository.findByName(
        updateFacultyDto.name,
      );
      if (existingFaculty && existingFaculty.id !== id) {
        throw new BadRequestException('Faculty with this name already exists');
      }
    }

    return this.facultyRepository.update(id, updateFacultyDto);
  }

  async remove(id: string): Promise<FacultyEntity> {
    // Check if faculty exists
    await this.findOne(id);

    return this.facultyRepository.remove(id);
  }
}
