import { Injectable, Logger } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import type { AttributeInfo } from 'langchain/chains/query_constructor';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';

import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { DatabaseService } from '../../../database/database.service';
import { AiService } from 'src/services/ai/ai.service';

@Injectable()
export class FileProcessorWorker {
  private readonly logger = new Logger(FileProcessorWorker.name);

  constructor(private readonly databaseService: DatabaseService, private readonly aiService: AiService) {}

  async processFileJob(job: Job): Promise<void> {
    this.logger.log(`Processing file job: ${job.id}`);

    try {
      const fileData = JSON.parse(job.data);

      /*
      Path: data.path
      read the pdf from path,
      chunk the pdf,
      call teh openai embedding model for every chunk,
      store the chunk in qdrant db
      */

      //Load the pdf from path
      const loader = new PDFLoader(fileData.path);
      const docs = await loader.load();

    await this.aiService.addDocumentsToVectorStore(docs);
      console.log('Documents added to vector store');

      // const textSplitter = new CharacterTextSplitter({
      //   chunkSize: 100,
      //   chunkOverlap: 0,
      // });
      // const texts = await textSplitter.splitText(docs);
      // console.log(texts);

      // const { filename, destination, path } = fileData;

      // this.logger.log(`Processing file: ${filename} at ${path}`);

      // // Find the file record in database
      // const fileRecord = await this.databaseService.file.findFirst({
      //   where: { filePath: path },
      // });

      // if (!fileRecord) {
      //   throw new Error(`File record not found for path: ${path}`);
      // }

      // // Update status to processing
      // await this.databaseService.file.update({
      //   where: { id: fileRecord.id },
      //   data: { status: FileStatus.PROCESSING },
      // });

      // // Extract text based on file type
      // let extractedText: string;
      // const mimeType = fileRecord.mimeType;

      // switch (mimeType) {
      //   case 'application/pdf':
      //     extractedText = await this.extractTextFromPDF(path);
      //     break;
      //   case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      //     extractedText = await this.extractTextFromDOCX(path);
      //     break;
      //   case 'text/plain':
      //     extractedText = await this.extractTextFromTXT(path);
      //     break;
      //   default:
      //     throw new Error('Unsupported file type');
      // }

      // // Update file with extracted text
      // await this.databaseService.file.update({
      //   where: { id: fileRecord.id },
      //   data: {
      //     extractedText,
      //     status: FileStatus.PROCESSED,
      //     processedAt: new Date(),
      //   },
      // });

      // this.logger.log(`File processed successfully: ${filename}`);
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
