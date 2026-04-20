// src/common/services/email/email.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { EmailTemplateService } from './templates/template.service';

@Module({
  imports: [EventEmitterModule],
  providers: [
    EmailService,
    EmailListener,
    EmailTemplateService,
    {
      provide: 'EmailProvider',
      useClass: NodemailerProvider,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
