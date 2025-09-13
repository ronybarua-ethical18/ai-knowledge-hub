import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailProvider } from './providers/email.provider';
import { EmailTemplateService } from './templates/template.service';

@Injectable()
export class EmailListener {
  constructor(
    @Inject('EmailProvider') private emailProvider: EmailProvider,
    private templateService: EmailTemplateService,
  ) {}

  @OnEvent('email.welcome')
  async handleWelcomeEmail(event: { to: string; fullName: string }) {
    const template = await this.templateService.getWelcomeTemplate(
      event.fullName,
    );

    await this.emailProvider.send({
      to: event.to,
      subject: 'Welcome to AI Knowledge Hub!',
      html: template.html,
      text: template.text,
    });
  }

  @OnEvent('email.verification')
  async handleVerificationEmail(event: { to: string; token: string }) {
    const template = await this.templateService.getVerificationTemplate(
      event.token,
    );

    await this.emailProvider.send({
      to: event.to,
      subject: 'Verify Your Email Address',
      html: template.html,
      text: template.text,
    });
  }

  @OnEvent('email.password-reset')
  async handlePasswordResetEmail(event: { to: string; token: string }) {
    const template = await this.templateService.getPasswordResetTemplate(
      event.token,
    );

    await this.emailProvider.send({
      to: event.to,
      subject: 'Reset Your Password',
      html: template.html,
      text: template.text,
    });
  }
}
