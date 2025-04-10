import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from './email.service.interface';
import { NodemailerProvider } from './providers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  private providers: IEmailService[] = [];

  constructor(private readonly configService: ConfigService) {
    this.providers = [new NodemailerProvider(this.logger)];
  }

  async sendMail({
    to,
    subject,
    options,
  }: {
    to: string;
    subject: EmailSubjects;
    options: { template: EmailPaths; data: { [key: string]: any } };
  }): Promise<boolean> {
    console.log('data', options.data);
    for (const provider of this.providers) {
      try {
        await provider.sendMail({ to, subject, options });
        return true; // Success, return immediately
      } catch (error) {
        this.logger.error(
          `Error sending email to ${to} with ${provider.constructor.name}`,
          error.message,
        );
      }
    }
    // If no provider succeeded
    this.logger.error(
      `All providers failed to send email to ${to} with subject ${subject}`,
    );
    return false; // Failure
  }

  async sendMaterialRejectionEmail(
    to: string,
    userName: string,
    materialLabel: string,
    comment: string,
  ) {
    await this.sendMail({
      to,
      subject: EmailSubjects.MATERIAL_REJECTION,
      options: {
        template: EmailPaths.MATERIAL_REJECTION,
        data: {
          userName,
          materialLabel,
          comment,
          supportEmail: this.configService.get('COMPANY_EMAIL'),
        },
      },
    });
  }

  async sendBlogRejectionEmail(
    to: string,
    userName: string,
    blogTitle: string,
    comment: string,
  ) {
    await this.sendMail({
      to,
      subject: EmailSubjects.BLOG_REJECTION,
      options: {
        template: EmailPaths.BLOG_REJECTION,
        data: {
          userName,
          blogTitle,
          comment,
          supportEmail: this.configService.get('COMPANY_EMAIL'),
        },
      },
    });
  }

  async sendModeratorRejectionEmail(to: string, comment: string) {
    // We simply expect to directly receive the email address now
    await this.sendMail({
      to,
      subject: EmailSubjects.MODERATOR_REJECTION,
      options: {
        template: EmailPaths.MODERATOR_REJECTION,
        data: {
          comment,
          supportEmail: this.configService.get('COMPANY_EMAIL'),
        },
      },
    });
  }

  async sendCourseRejectionEmail(
    to: string,
    userName: string,
    courseName: string,
    comment: string,
  ) {
    await this.sendMail({
      to,
      subject: EmailSubjects.COURSE_REJECTION,
      options: {
        template: EmailPaths.COURSE_REJECTION,
        data: {
          userName,
          courseName,
          comment,
          supportEmail: this.configService.get('COMPANY_EMAIL'),
        },
      },
    });
  }

  async sendDLCRejectionEmail(
    to: string,
    userName: string,
    courseName: string,
    level: number,
    comment: string,
  ) {
    await this.sendMail({
      to,
      subject: EmailSubjects.DLC_REJECTION,
      options: {
        template: EmailPaths.DLC_REJECTION,
        data: {
          userName,
          courseName,
          level,
          comment,
          supportEmail: this.configService.get('COMPANY_EMAIL'),
        },
      },
    });
  }
}
