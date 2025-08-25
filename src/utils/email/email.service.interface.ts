import { EmailPayloadDto } from './dto/email-payload.dto';

export interface IEmailService {
  // Service-level API used by app code
  sendMail(emailPayload: EmailPayloadDto): Promise<boolean>;
}
