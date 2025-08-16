import { Logger } from '@nestjs/common';
import { IEmailService } from '../email.service.interface';
import { EmailPayloadDto } from '../dto/email-payload.dto';
import { EmailRenderService } from '../email-render.service';
import { configService } from 'src/utils/config/config.service';
import { ENV } from 'src/utils/config/env.enum';

export default class BrevoProvider implements IEmailService {
  private readonly logger: Logger;
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly companyName: string;
  private readonly apiUrl: string = 'https://api.brevo.com/v3/smtp/email';
  private readonly emailRenderService: EmailRenderService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.apiKey = configService.get(ENV.BREVO_API_KEY);
    this.senderEmail = configService.get(ENV.BREVO_SENDER_EMAIL);
    this.companyName = configService.get(ENV.COMPANY_NAME);
    this.emailRenderService = new EmailRenderService();
  }

  public async sendMail(emailPayload: EmailPayloadDto): Promise<boolean> {
    try {
      // Render the email using the render service
      const renderedEmail =
        await this.emailRenderService.renderEmail(emailPayload);

      // Prepare the email payload for Brevo API
      const brevoPayload = {
        sender: {
          name: this.companyName,
          email: this.senderEmail,
        },
        to: [
          {
            email: renderedEmail.to,
          },
        ],
        subject: renderedEmail.subject,
        htmlContent: renderedEmail.htmlContent,
      };

      // Send email via Brevo API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(brevoPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Brevo API error:', errorData);
        throw new Error(
          `Brevo API error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      this.logger.log('Email sent successfully via Brevo:', result);
      return true;
    } catch (error) {
      this.logger.error('Error sending email via Brevo:', error);
      throw error;
    }
  }
}
