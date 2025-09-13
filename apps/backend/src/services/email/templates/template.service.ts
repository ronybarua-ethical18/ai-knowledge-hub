import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailTemplateService {
  constructor(private configService: ConfigService) {}

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
    return this.compileTemplate('welcome', {
      fullName,
      loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
    });
  }

  async getVerificationTemplate(token: string) {
    return this.compileTemplate('verification', {
      verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`,
    });
  }

  async getPasswordResetTemplate(token: string) {
    return this.compileTemplate('password-reset', {
      resetUrl: `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`,
    });
  }
}
