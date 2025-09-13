/* eslint-disable */
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.config';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseService.name);
  private isConnected = false;

  constructor() {
    super({
      datasources: {
        db: {
          url: `${env.config.DATABASE_URL}?connection_limit=${env.config.DATABASE_POOL_SIZE}&pool_timeout=${env.config.DATABASE_POOL_TIMEOUT}&connect_timeout=${env.config.DATABASE_CONNECT_TIMEOUT}`,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connection established successfully');

      // Verify connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection verified');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutting down with signal: ${signal}`);
    await this.cleanup();
  }

  private async cleanup() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.isConnected = false;
        this.logger.log('Database connection closed successfully');
      } catch (error) {
        this.logger.error('Failed to disconnect from database:', error);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      provider: 'postgresql',
      url: env.config.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
    };
  }
}
