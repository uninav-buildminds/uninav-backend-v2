import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { EVENTS } from '@app/common/modules/events/events.enum';

@Injectable()
export class EventsEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // Send email notification using the event system
  sendEmail(emailPayload: EmailPayloadDto) {
    this.eventEmitter.emit(EVENTS.NOTIFICATION_EMAIL, emailPayload);
  }
}
