import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

export type NotificationType =
  | 'material_approved'
  | 'material_rejected'
  | 'points_awarded'
  | 'email_verified'
  | 'moderator_approved'
  | 'moderator_rejected'
  | 'system';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly repo: NotificationsRepository) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    description: string,
    resourceId?: string,
  ) {
    return this.repo.create({ userId, type, title, description, resourceId });
  }

  async list(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      query?: string;
      status?: 'read' | 'unread';
    },
  ) {
    return this.repo.list(userId, options);
  }

  async markRead(userId: string, id: string) {
    return this.repo.markRead(userId, id);
  }

  async markAllRead(userId: string) {
    return this.repo.markAllRead(userId);
  }
}
