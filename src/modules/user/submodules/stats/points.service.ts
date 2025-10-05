import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { PointsRepository } from './points.repository';

// Point allocation constants
export const POINTS_CONFIG = {
  READING_PER_DAY: 1, // Points for reading materials (once per day)
  UPLOAD: 5, // Points for uploading a material
  DOWNLOAD: 0.1, // Points for downloading a material
} as const;

@Injectable()
export class PointsService {
  constructor(
    private readonly pointsRepository: PointsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Allocate reading points to a user (once per day)
   */
  async allocateReadingPoints(userId: string): Promise<{ allocated: boolean }> {
    const allocated = await this.pointsRepository.allocatePoints(
      userId,
      POINTS_CONFIG.READING_PER_DAY,
    );
    if (allocated) {
      await this.notificationsService.create(
        userId,
        'points_awarded',
        'Points Awarded',
        `You earned ${POINTS_CONFIG.READING_PER_DAY} point for reading today.`,
      );
    }
    return { allocated };
  }

  /**
   * Allocate points for uploading a material
   */
  async allocateUploadPoints(userId: string): Promise<void> {
    await this.pointsRepository.allocatePointsImmediate(
      userId,
      POINTS_CONFIG.UPLOAD,
    );
    await this.notificationsService.create(
      userId,
      'points_awarded',
      'Points Awarded',
      `You earned ${POINTS_CONFIG.UPLOAD} points for uploading a material.`,
    );
  }

  /**
   * Allocate points for downloading a material
   */
  async allocateDownloadPoints(userId: string): Promise<void> {
    await this.pointsRepository.allocatePointsImmediate(
      userId,
      POINTS_CONFIG.DOWNLOAD,
    );
    await this.notificationsService.create(
      userId,
      'points_awarded',
      'Points Awarded',
      `You earned ${POINTS_CONFIG.DOWNLOAD} point(s) for downloading a material.`,
    );
  }

  /**
   * Calculate points percentage based on last 30 days divided by 10
   * Returns a string with percentage sign
   */
  async getPointsPercentage(userId: string): Promise<string> {
    const totalPoints = await this.pointsRepository.getPointsInLastNDays(
      userId,
      30,
    );
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
    const last30Days = await this.pointsRepository.getPointsInLastNDays(
      userId,
      30,
    );
    const allTime = await this.pointsRepository.getTotalPoints(userId);
    const percentage = Math.floor(last30Days / 10);

    return {
      last30Days,
      allTime,
      percentage: `${percentage}%`,
    };
  }
}
