import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Query('workspaceId') workspaceId?: string, // Make optional with ?
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.fileUploadService.uploadFile(
      file,
      req.user.id,
      workspaceId || 'default',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user files' })
  async getUserFiles(
    @Request() req: any,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.fileUploadService.getUserFiles(req.user.id, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  async getFileById(@Param('id') id: string, @Request() req: any) {
    return this.fileUploadService.getFileById(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(@Param('id') id: string, @Request() req: any) {
    await this.fileUploadService.deleteFile(id, req.user.id);
    return { message: 'File deleted successfully' };
  }
}
