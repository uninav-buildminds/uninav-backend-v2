import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@app/common/modules/events/events.enum';
import { EmailService } from 'src/utils/email/email.service';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';

@Injectable()
export class EventsListeners {
  private logger = new Logger(EventsListeners.name);

  constructor(private readonly emailService: EmailService) {}

  @OnEvent(EVENTS.NOTIFICATION_EMAIL)
  async handleEmailNotification(emailPayload: EmailPayloadDto) {
    try {
      await this.emailService.sendMail(emailPayload);
      this.logger.log(
        `Email sent successfully to ${emailPayload.to} with type ${emailPayload.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${emailPayload.to} with type ${emailPayload.type}:`,
        error,
      );
    }
  }
}
