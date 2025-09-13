import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { FileUploadController } from './file-upload-controller';
import { FileUploadService } from './file-upload.service';

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
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
