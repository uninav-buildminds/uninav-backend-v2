import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { EmailService } from 'src/utils/email/email.service';
import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { UserRoleEnum } from 'src/utils/types/db.types';
@Injectable()
export class EventsListeners {
  private logger = new Logger(EmailService.name);

  constructor(private readonly emailService: EmailService) {}
  @OnEvent(EVENTS.USER_REGISTERED)
  async handleUserRegisteredEvent(payload: {
    email: string;
    firstName: string;
    lastName: string;
    departmentName: string;
    role: UserRoleEnum;
  }) {
    try {
      // Select the appropriate template based on user role
      let template: EmailPaths;

      switch (payload.role) {
        case UserRoleEnum.ADMIN:
          template = EmailPaths.WELCOME_ADMIN;
          break;
        case UserRoleEnum.MODERATOR:
          template = EmailPaths.WELCOME_MODERATOR;
          break;
        case UserRoleEnum.STUDENT:
        default:
          template = EmailPaths.WELCOME_STUDENT;
          break;
      }

      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.WELCOME,
        options: { template, data: payload },
      });
    } catch (error) {
      this.logger.error('Failed to send welcome message:', error);
    }
  }
}
