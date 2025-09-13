import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../../user/user.service';
import { ApiError } from '../../../../common/exceptions/api-error.exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.password) {
      this.trackFailedAttempt(email);
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await this.userService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      this.trackFailedAttempt(email);
      throw ApiError.unauthorized('Invalid credentials');
    }

    this.resetAttempts(email);
    return user;
  }

  private async trackFailedAttempt(email: string): Promise<void> {
    try {
      const user = await this.userService.findUserForLockoutCheck(email);
      if (!user) return;

      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const maxAttempts = 5;
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes

      if (failedAttempts >= maxAttempts) {
        const lockoutExpiry = new Date(Date.now() + lockoutDuration);
        await this.userService.lockAccount(user.id, lockoutExpiry);
      } else {
        await this.userService.incrementFailedAttempts(user.id, failedAttempts);
      }
    } catch (error) {
      console.error('Error tracking failed attempt:', error);
    }
  }

  private async resetAttempts(email: string): Promise<void> {
    try {
      const user = await this.userService.findUserForLockoutCheck(email);
      if (user && user.failedLoginAttempts > 0) {
        await this.userService.resetFailedAttempts(user.id);
      }
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  }
}
