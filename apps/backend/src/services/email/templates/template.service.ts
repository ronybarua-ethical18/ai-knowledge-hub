import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../../../config/env.config';

@Injectable()
export class EmailTemplateService {
  private getTemplatePath(templateName: string): string {
    return path.join(
      process.cwd(),
      'src',
      'services',
      'email',
      'templates',
      `${templateName}.handlebars`,
    );
  }

  private compileTemplate(
    templateName: string,
    data: any,
  ): { html: string; text: string } {
    const templatePath = this.getTemplatePath(templateName);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template(data);
    const text = this.htmlToText(html);

    return { html, text };
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async getWelcomeTemplate(fullName: string) {
    const base = env.config.FRONTEND_URL;
    return this.compileTemplate('welcome', {
      fullName,
      loginUrl: `${base}/login`,
    });
  }

  async getVerificationTemplate(token: string) {
    const base = env.config.FRONTEND_URL;
    return this.compileTemplate('verification', {
      verificationUrl: `${base}/verify-email?token=${token}`,
    });
  }

  async getPasswordResetTemplate(token: string) {
    const base = env.config.FRONTEND_URL;
    return this.compileTemplate('password-reset', {
      resetUrl: `${base}/reset-password?token=${token}`,
    });
  }
}
