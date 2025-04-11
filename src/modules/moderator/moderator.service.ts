import { Injectable, NotFoundException } from '@nestjs/common';
import { ModeratorRepository } from './moderator.repository';
import { ApprovalStatus } from 'src/utils/types/db.types';

@Injectable()
export class ModeratorService {
  constructor(private readonly moderatorRepository: ModeratorRepository) {}

  async create(userId: string, departmentId: string) {
    return this.moderatorRepository.create({ userId, departmentId });
  }

  async findById(userId: string) {
    const moderator = await this.moderatorRepository.findById(userId);
    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${userId} not found`);
    }
    return moderator;
  }

  async findAll(reviewStatus?: ApprovalStatus) {
    return this.moderatorRepository.findAll(reviewStatus);
  }

  async review(
    userId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    const moderator = await this.findById(userId);
    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${userId} not found`);
    }

    return this.moderatorRepository.updateReviewStatus(userId, reviewData);
  }

  async delete(userId: string) {
    const moderator = await this.findById(userId);
    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${userId} not found`);
    }

    return this.moderatorRepository.delete(userId);
  }

  async countModeratorsByStatus(departmentId?: string) {
    return this.moderatorRepository.countByStatus(departmentId);
  }
}
