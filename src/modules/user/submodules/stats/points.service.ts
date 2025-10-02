import { Injectable } from '@nestjs/common';
import { PointsRepository } from './points.repository';

@Injectable()
export class PointsService {
  constructor(private readonly pointsRepository: PointsRepository) {}

  /**
   * Allocate reading points to a user (once per day)
   */
  async allocateReadingPoints(userId: string): Promise<{ allocated: boolean }> {
    const allocated = await this.pointsRepository.allocatePoints(userId, 1);
    return { allocated };
  }

  /**
   * Calculate points percentage based on last 30 days divided by 10
   * Returns a string with percentage sign
   */
  async getPointsPercentage(userId: string): Promise<string> {
    const totalPoints = await this.pointsRepository.getPointsInLastNDays(userId, 30);
    const percentage = Math.floor(totalPoints / 10);
    return `${percentage}%`;
  }

  /**
   * Get raw points data for analytics
   */
  async getPointsData(userId: string): Promise<{
    last30Days: number;
    allTime: number;
    percentage: string;
  }> {
    const last30Days = await this.pointsRepository.getPointsInLastNDays(userId, 30);
    const allTime = await this.pointsRepository.getTotalPoints(userId);
    const percentage = Math.floor(last30Days / 10);

    return {
      last30Days,
      allTime,
      percentage: `${percentage}%`,
    };
  }
}

