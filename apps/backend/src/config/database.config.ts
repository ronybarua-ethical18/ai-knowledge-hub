import { Injectable } from '@nestjs/common';
import { env } from './env.config';

@Injectable()
export class DatabaseConfigService {
  getDatabaseUrl(): string {
    return env.config.DATABASE_URL;
  }

  getDatabaseConfig() {
    return {
      url: env.config.DATABASE_URL,
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
      },
    };
  }
}
