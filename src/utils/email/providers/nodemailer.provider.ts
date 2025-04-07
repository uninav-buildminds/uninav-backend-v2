import { google } from 'googleapis';
import { createTransport, Transporter } from 'nodemailer';
import { ENV } from 'src/utils/config/env.enum';
import * as ejs from 'ejs';
import * as path from 'path';
import { IEmailService } from '../email.service.interface';
import { configService } from 'src/utils/config/config.service';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { Logger } from '@nestjs/common';

class OAuth2Client extends google.auth.OAuth2 {}

export default class NodemailerProvider implements IEmailService {
  private readonly OAuth2Client: OAuth2Client;
  private readonly transporter: Transporter;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.OAuth2Client = new google.auth.OAuth2(
      configService.get(ENV.GMAIL_CLIENT_ID),
      configService.get(ENV.GMAIL_CLIENT_SECRET),
      'https://developers.google.com/oauthplayground', //or your redirect URI
    );
    this.OAuth2Client.setCredentials({
      refresh_token: configService.get(ENV.GMAIL_REFRESH_TOKEN),
    });
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: configService.get(ENV.COMPANY_EMAIL),
        clientId: configService.get(ENV.GMAIL_CLIENT_ID),
        clientSecret: configService.get(ENV.GMAIL_CLIENT_SECRET),
        refreshToken: configService.get(ENV.GMAIL_REFRESH_TOKEN),
      },
    } as unknown as SMTPPool);
  }

  public sendMail({
    to,
    subject,
    options,
  }: {
    to: string;
    subject: EmailSubjects;
    options: { template: EmailPaths; data: { [key: string]: any } };
  }): Promise<boolean> {
    (this.transporter as any).accessToken =
      this.OAuth2Client.getAccessToken() as any;

    return new Promise<boolean>((resolve, reject) => {
      const template = path.resolve('view/emails', options.template);
      console.log('template-data', template, options.data);

      ejs.renderFile(template, options.data, (error, html) => {
        if (error) {
          this.logger.error('Error rendering email template', error);
          reject(error);
          return;
        }
        this.transporter.sendMail(
          {
            from: {
              name: configService.get(ENV.COMPANY_NAME),
              address: configService.get(ENV.COMPANY_EMAIL),
            },
            to,
            subject,
            html,
          },
          (err, info) => {
            if (err) {
              this.logger.error('Error sending email', err, info);
              reject(err);
              return;
            }
            this.logger.log('Email sent successfully');
            resolve(true);
          },
        );
      });
    });
  }
}
