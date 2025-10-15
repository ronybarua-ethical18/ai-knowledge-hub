import { Module, OnModuleInit } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { FileUploadController } from './file-upload-controller';
import { FileUploadService } from './file-upload.service';
import { QueueModule } from '../../../services/queue/queue.module';
import { FileProcessorWorker } from '../../../services/queue/workers/file-processor.worker';
import { QueueService } from '../../../services/queue/queue.service';
import { AiModule } from 'src/services/ai/ai.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
    QueueModule,
    AiModule
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, FileProcessorWorker],
  exports: [FileUploadService],
})
export class FileUploadModule implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly fileProcessorWorker: FileProcessorWorker,
  ) {}

  async onModuleInit() {
    // Create worker for file-ready queue
    this.queueService.createWorker(
      'file-ready',
      this.fileProcessorWorker.processFileJob.bind(this.fileProcessorWorker),
    );
  }
}
