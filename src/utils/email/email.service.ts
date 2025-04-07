import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from './email.service.interface';
import { NodemailerProvider } from './providers';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  private providers: IEmailService[] = [];
  constructor() {
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
}
