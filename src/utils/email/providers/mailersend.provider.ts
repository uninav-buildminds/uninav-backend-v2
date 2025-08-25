import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { Logger } from '@nestjs/common';
import { EmailSenderProvider } from './email-sender.interface';
import { RenderedEmailDto } from '../dto/rendered-email.dto';
import { configService } from 'src/utils/config/config.service';
import { ENV } from 'src/utils/config/env.enum';

/**
 * MailerSend email provider implementation
 * Uses the MailerSend API to send emails
 */
export default class MailerSendProvider implements EmailSenderProvider {
  private readonly mailerSend: MailerSend;
  private readonly logger: Logger;

  // Static configuration properties loaded from environment
  private static mailSendApiKey: string = configService.get(
    ENV.MAILSEND_API_KEY,
  );
  private static mailSendSenderEmail: string = configService.get(
    ENV.MAILSEND_SENDER_EMAIL,
  );
  private static companyName: string = configService.get(ENV.COMPANY_NAME);

  constructor(logger: Logger) {
    this.logger = logger;

    // Initialize MailerSend client with API key
    this.mailerSend = new MailerSend({
      apiKey: MailerSendProvider.mailSendApiKey,
    });
  }

  /**
   * Send email using MailerSend API
   * @param renderedEmail - The email data to send
   * @returns Promise<boolean> - True if email sent successfully, false otherwise
   */
  public async sendMail(renderedEmail: RenderedEmailDto): Promise<boolean> {
    try {
      // Create sender object
      const sentFrom = new Sender(
        MailerSendProvider.mailSendSenderEmail,
        MailerSendProvider.companyName || 'UniNav',
      );

      // Create recipient object
      const recipients = [new Recipient(renderedEmail.to)];

      // Build email parameters
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(renderedEmail.subject)
        .setHtml(renderedEmail.htmlContent);

      // Send the email
      const response = await this.mailerSend.email.send(emailParams);

      // Log success with message ID if available
      const messageId = response.headers?.['x-message-id'] || 'unknown';
      this.logger.log(
        `Email sent successfully via MailerSend to ${renderedEmail.to} (Message ID: ${messageId})`,
      );

      return true;
    } catch (error) {
      // Log detailed error information
      this.logger.error(
        `Error sending email via MailerSend to ${renderedEmail.to}:`,
        error?.message || error,
      );

      // Check for specific MailerSend API errors
      if (error?.response?.status) {
        this.logger.error(
          `MailerSend API Error - Status: ${error.response.status}, Message: ${error.response.data?.message || 'Unknown error'}`,
        );
      }

      throw error;
    }
  }
}
