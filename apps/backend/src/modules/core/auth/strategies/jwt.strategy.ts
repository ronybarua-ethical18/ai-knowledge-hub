import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../../../config/env.config';
import { UserService } from '../../user/user.service';
import { ApiError } from '../../../../common/exceptions/api-error.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.config.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.isEmailVerified) {
      throw ApiError.unauthorized('Email not verified');
    }

    return user;
  }
}
