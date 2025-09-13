import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from './email.provider';
import { env } from '../../../config/env.config'; // Use your custom config

@Injectable()
export class NodemailerProvider implements EmailProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.config.SMTP_HOST,
      port: env.config.SMTP_PORT,
      secure: env.config.SMTP_SECURE,
      auth: {
        user: env.config.SMTP_USER,
        pass: env.config.SMTP_PASS,
      },
    });

    this.logger.log(
      `SMTP configured for: ${env.config.SMTP_HOST}:${env.config.SMTP_PORT}`,
    );
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    this.logger.log(
      `Sending email to: ${options.to} with subject: ${options.subject}`,
    );

    try {
      const result = await this.transporter.sendMail({
        from: env.config.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(
        `Email sent successfully. Message ID: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }
}
