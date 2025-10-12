import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FileStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class FileProcessorWorker {
  private readonly logger = new Logger(FileProcessorWorker.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async processFileJob(job: Job): Promise<void> {
    this.logger.log(`Processing file job: ${job.id}`);

    try {
      const fileData = JSON.parse(job.data);
      const { filename, destination, path } = fileData;

      this.logger.log(`Processing file: ${filename} at ${path}`);

      // Find the file record in database
      const fileRecord = await this.databaseService.file.findFirst({
        where: { filePath: path },
      });

      if (!fileRecord) {
        throw new Error(`File record not found for path: ${path}`);
      }

      // Update status to processing
      await this.databaseService.file.update({
        where: { id: fileRecord.id },
        data: { status: FileStatus.PROCESSING },
      });

      // Extract text based on file type
      let extractedText: string;
      const mimeType = fileRecord.mimeType;

      switch (mimeType) {
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(path);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractTextFromDOCX(path);
          break;
        case 'text/plain':
          extractedText = await this.extractTextFromTXT(path);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      // Update file with extracted text
      await this.databaseService.file.update({
        where: { id: fileRecord.id },
        data: {
          extractedText,
          status: FileStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      this.logger.log(`File processed successfully: ${filename}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Failed to process file job ${job.id}: ${errorMessage}`,
      );
      throw error;
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
}
