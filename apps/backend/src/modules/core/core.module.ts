import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from '../../database/database.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AiModule } from '../../services/ai/ai.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, FileUploadModule, AiModule],
  exports: [AuthModule, UserModule, FileUploadModule, AiModule],
})
export class CoreModule {}
