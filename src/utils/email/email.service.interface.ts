import { EmailPayloadDto } from './dto/email-payload.dto';

export interface IEmailService {
  sendMail(emailPayload: EmailPayloadDto): Promise<boolean>;
}
