import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorsConfigService } from '../config/cors.config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { env } from '../config/env.config';
import { CoreModule } from '../modules/core/core.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.config.THROTTLE_TTL,
        limit: env.config.THROTTLE_LIMIT,
      },
    ]),
    CoreModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CorsConfigService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
