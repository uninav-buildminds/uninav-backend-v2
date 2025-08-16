import { Injectable, Logger } from '@nestjs/common';
import { EmailType } from './constants/email.enum';
import { EmailSubjects } from './config/email-subjects.config';
import { EmailTemplates } from './config/email-templates.config';
import { EmailPayloadDto } from './dto/email-payload.dto';
import * as ejs from 'ejs';
import * as path from 'path';
import { UserRoleEnum } from '../types/db.types';
import { EmailBaseConfig } from './config/email-base.config';

export interface RenderedEmail {
  to: string;
  subject: string;
  htmlContent: string;
}

@Injectable()
export class EmailRenderService {
  private readonly logger = new Logger(EmailRenderService.name);

  /**
   * Renders an email using EJS template and email configuration
   */
  async renderEmail(emailPayload: EmailPayloadDto): Promise<RenderedEmail> {
    try {
      // Get subject from configuration
      const subject = EmailSubjects[emailPayload.type];
      if (!subject) {
        throw new Error(
          `No subject configured for email type: ${emailPayload.type}`,
        );
      }

      emailPayload.context = {
        ...emailPayload.context,
        ...EmailBaseConfig,
      };
      // Get template path from configuration
      let templateFile = EmailTemplates[emailPayload.type];

      // Handle dynamic template selection for welcome emails based on user role
      if (
        emailPayload.type === EmailType.WELCOME &&
        emailPayload.context.role
      ) {
        const role = emailPayload.context.role;
        switch (role) {
          case UserRoleEnum.ADMIN:
            templateFile = 'welcome-admin.ejs';
            break;
          case UserRoleEnum.MODERATOR:
            templateFile = 'welcome-moderator.ejs';
            break;
          case 'student':
          default:
            templateFile = 'welcome-student.ejs';
            break;
        }
      }

      if (!templateFile) {
        throw new Error(
          `No template configured for email type: ${emailPayload.type}`,
        );
      }

      // Render the HTML content
      const templatePath = path.resolve('view/emails', templateFile);
      const htmlContent = await this.renderTemplate(
        templatePath,
        emailPayload.context,
      );

      return {
        to: emailPayload.to,
        subject,
        htmlContent,
      };
    } catch (error) {
      this.logger.error('Error rendering email:', error);
      throw error;
    }
  }

  /**
   * Helper method to render EJS templates
   */
  private renderTemplate(
    templatePath: string,
    data: Record<string, any>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ejs.renderFile(templatePath, data, (error, html) => {
        if (error) {
          this.logger.error('Error rendering email template:', error);
          reject(error);
          return;
        }
        resolve(html);
      });
    });
  }
}
