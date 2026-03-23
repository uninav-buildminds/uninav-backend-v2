import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TutorialsRepository } from './tutorials.repository';
import { TutorialFilterDto } from './dto/tutorial-filter.dto';

@Injectable()
export class TutorialsService {
  constructor(private readonly tutorialsRepository: TutorialsRepository) {}

  async findAll(filters: TutorialFilterDto) {
    return this.tutorialsRepository.findAll(filters);
  }

  async findOne(id: string) {
    const tutorial = await this.tutorialsRepository.findById(id);
    if (!tutorial) {
      throw new NotFoundException(`Tutorial with ID ${id} not found`);
    }
    return tutorial;
  }

  async enroll(userId: string, tutorialId: string) {
    const tutorial = await this.tutorialsRepository.findById(tutorialId);
    if (!tutorial) {
      throw new NotFoundException(`Tutorial with ID ${tutorialId} not found`);
    }

    const existingEnrollment = await this.tutorialsRepository.findEnrollment(
      userId,
      tutorialId,
    );
    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this tutorial');
    }

    return this.tutorialsRepository.enroll(userId, tutorialId);
  }
}
