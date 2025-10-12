import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { FileType, FileStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { ApiError } from '../../../common/exceptions/api-error.exception';
import { QueueService } from '../../../services/queue/queue.service';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly allowedMimeTypes = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'DOCX',
    'text/plain': 'TXT',
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queueService: QueueService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    workspaceId: string,
  ): Promise<{ id: string; message: string }> {
    this.logger.log(`Uploading file: ${file.originalname} for user: ${userId}`);

    // Validate file type
    if (!this.allowedMimeTypes[file.mimetype]) {
      throw ApiError.badRequest(
        'Unsupported file type. Only PDF, DOCX, and TXT files are allowed.',
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw ApiError.badRequest('File size exceeds 10MB limit.');
    }

    try {
      // Create file record in database
      const fileRecord = await this.databaseService.file.create({
        data: {
          filename: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          fileType: this.allowedMimeTypes[file.mimetype] as FileType,
          status: FileStatus.UPLOADED,
          userId,
          workspaceId,
          filePath: file.path,
        },
      });

      // Add file to queue
      const fileQueue = this.queueService.createQueue('file-ready');
      await fileQueue.add(
        'process-file',
        JSON.stringify({
          filename: file.originalname,
          destination: file.destination,
          path: file.path,
        }),
      );

      return {
        id: fileRecord.id,
        message: 'File uploaded successfully. Processing in background...',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Failed to upload file: ${errorMessage}`);
      throw ApiError.badRequest('Failed to upload file');
    }
  }

  private async processFile(
    fileId: string,
    filePath: string,
    mimeType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing file: ${fileId}`);

      // Update status to processing
      await this.databaseService.file.update({
        where: { id: fileId },
        data: { status: FileStatus.PROCESSING },
      });

      // Extract text based on file type
      let extractedText: string;

      switch (mimeType) {
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(filePath);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractTextFromDOCX(filePath);
          break;
        case 'text/plain':
          extractedText = await this.extractTextFromTXT(filePath);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      // Update file with extracted text
      await this.databaseService.file.update({
        where: { id: fileId },
        data: {
          extractedText,
          status: FileStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      this.logger.log(`File processed successfully: ${fileId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Failed to process file ${fileId}: ${errorMessage}`);

      // Update status to failed
      await this.databaseService.file.update({
        where: { id: fileId },
        data: {
          status: FileStatus.FAILED,
          errorMessage,
        },
      });
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  private async extractTextFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractTextFromTXT(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async getUserFiles(userId: string, workspaceId?: string): Promise<any[]> {
    const whereClause = workspaceId ? { userId, workspaceId } : { userId };

    return this.databaseService.file.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        fileType: true,
        status: true,
        createdAt: true,
        processedAt: true,
        errorMessage: true,
      },
    });
  }

  async getFileById(fileId: string, userId: string): Promise<any> {
    const file = await this.databaseService.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFileById(fileId, userId);

    // Delete physical file
    try {
      await fs.unlink(file.filePath);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(`Failed to delete physical file: ${errorMessage}`);
    }

    // Delete database record
    await this.databaseService.file.delete({
      where: { id: fileId },
    });

    this.logger.log(`File deleted: ${fileId}`);
  }
}
