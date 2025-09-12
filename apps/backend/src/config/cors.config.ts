import { Injectable } from '@nestjs/common';
import { CorsOptions } from 'cors';
import { env } from './env.config';

@Injectable()
export class CorsConfigService {
  private readonly allowedOrigins: string[];

  constructor() {
    this.allowedOrigins = (env.config.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  getCorsOptions(): CorsOptions {
    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ): void => {
        if (!origin || this.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: Origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
  }
}
