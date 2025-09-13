import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../../user/user.service';
import { ApiError } from '../../../../common/exceptions/api-error.exception';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private userService: UserService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email;

    if (email) {
      const isLocked = await this.isAccountLocked(email);
      if (isLocked) {
        throw ApiError.forbidden(
          'Account is temporarily locked due to multiple failed attempts.',
        );
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private async isAccountLocked(email: string): Promise<boolean> {
    try {
      const user = await this.userService.findUserForLockoutCheck(email);
      if (!user) return false;

      if (user.isLocked) {
        const lockoutExpiry = user.lockoutExpiry;
        if (lockoutExpiry && new Date() > lockoutExpiry) {
          await this.userService.unlockAccount(user.id);
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
