// src/common/services/email/email.module.ts
import { Module, Injectable, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { EmailTemplateService } from './templates/template.service';

@Module({
  imports: [ConfigModule, EventEmitterModule],
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
