import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env.config';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private isConnected = false;

  async onModuleInit() {
    try {
      // Test connection by adding a test job
      const testQueue = new Queue('test-connection', {
        connection: this.getRedisConnection(),
      });
      await testQueue.add('test', { test: true });
      await testQueue.close();
      this.isConnected = true;
      this.logger.log('✅ Redis connection established successfully');
    } catch (error) {
      this.logger.error(
        '❌ Failed to connect to Redis:',
        error instanceof Error ? error.message : String(error),
      );
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connections...');

    // Close all workers
    for (const [queueName, worker] of this.workers) {
      await worker.close();
      this.logger.log(`Worker for ${queueName} closed`);
    }

    // Close all queues
    for (const [queueName, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Queue ${queueName} closed`);
    }

    this.logger.log('Redis connections closed');
  }

  private getRedisConnection() {
    return {
      host: env.config.REDIS_HOST,
      port: env.config.REDIS_PORT,
    };
  }

  createQueue(queueName: string): Queue {
    if (!this.isConnected) {
      throw new Error(
        'Redis is not connected. Please check your Redis server.',
      );
    }

    if (this.queues.has(queueName)) {
      return this.queues.get(queueName)!;
    }

    const queue = new Queue(queueName, {
      connection: this.getRedisConnection(),
    });

    this.queues.set(queueName, queue);
    this.logger.log(`Queue ${queueName} created`);
    return queue;
  }

  createWorker(
    queueName: string,
    processor: (job: any) => Promise<any>,
  ): Worker {
    if (!this.isConnected) {
      throw new Error(
        'Redis is not connected. Please check your Redis server.',
      );
    }

    const worker = new Worker(queueName, processor, {
      connection: this.getRedisConnection(),
    });

    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed:`, err);
    });

    worker.on('error', (err) => {
      this.logger.error(`Worker error:`, err);
    });

    worker.on('ready', () => {
      this.logger.log(`Worker for ${queueName} is ready`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker for ${queueName} created`);
    return worker;
  }

  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}
