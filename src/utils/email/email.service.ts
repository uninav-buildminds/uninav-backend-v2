import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from './email.service.interface';
import { BrevoProvider } from './providers';
import { EmailPayloadDto } from './dto/email-payload.dto';
import { EmailRenderService } from './email-render.service';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  private providers: IEmailService[] = [];

  constructor(private readonly emailRenderService: EmailRenderService) {
    this.providers = [new BrevoProvider(this.logger)];
  }

  async sendMail(emailPayload: EmailPayloadDto): Promise<boolean> {
    try {
      // Render the email using the render service
      const renderedEmail =
        await this.emailRenderService.renderEmail(emailPayload);

      // Try each provider until one succeeds
      for (const provider of this.providers) {
        try {
          await provider.sendMail(emailPayload);
          this.logger.log(
            `Email sent successfully to ${emailPayload.to} via ${provider.constructor.name}`,
          );
          return true;
        } catch (error) {
          this.logger.error(
            `Error sending email to ${emailPayload.to} with ${provider.constructor.name}`,
            error.message,
          );
        }
      }

      // If no provider succeeded
      this.logger.error(
        `All providers failed to send email to ${emailPayload.to} with type ${emailPayload.type}`,
      );
      return false;
    } catch (error) {
      this.logger.error('Error in email service:', error);
      return false;
    }
  }
}
