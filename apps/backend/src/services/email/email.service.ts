import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EmailService {
  constructor(private eventEmitter: EventEmitter2) {}

  async sendWelcomeEmail(user: {
    email: string;
    fullName: string;
  }): Promise<void> {
    this.eventEmitter.emit('email.welcome', {
      to: user.email,
      fullName: user.fullName,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    this.eventEmitter.emit('email.verification', {
      to: email,
      token,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    this.eventEmitter.emit('email.password-reset', {
      to: email,
      token,
    });
  }
}
