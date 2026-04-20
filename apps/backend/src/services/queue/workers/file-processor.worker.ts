import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import * as mammoth from 'mammoth';
import { AiService } from 'src/services/ai/ai.service';

type FileJobPayload = {
  path: string;
  filename?: string;
  fileId?: string;
  workspaceId?: string;
  userId?: string;
  mimeType?: string;
};

@Injectable()
export class FileProcessorWorker {
  private readonly logger = new Logger(FileProcessorWorker.name);

  constructor(private readonly aiService: AiService) {}

  async processFileJob(job: Job): Promise<void> {
    this.logger.log(`Processing file job: ${job.id}`);

    try {
      const fileData = JSON.parse(job.data) as FileJobPayload;

      if (!fileData.fileId || !fileData.workspaceId || !fileData.userId) {
        this.logger.warn(
          `Job ${job.id}: missing fileId, workspaceId, or userId — skipping RAG indexing. Re-upload the file after deploying the latest backend.`,
        );
        return;
      }

      const { fileId, workspaceId, userId } = fileData;
      const sourceLabel = fileData.filename ?? fileId;
      const mimeType = fileData.mimeType ?? 'application/pdf';

      let docs: Document[];

      switch (mimeType) {
        case 'application/pdf': {
          const loader = new PDFLoader(fileData.path);
          docs = await loader.load();
          break;
        }
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
          const text = await this.extractTextFromDOCX(fileData.path);
          docs = [
            new Document({
              pageContent: text,
              metadata: { source: 'docx' },
            }),
          ];
          break;
        }
        case 'text/plain': {
          const text = await this.extractTextFromTXT(fileData.path);
          docs = [
            new Document({
              pageContent: text,
              metadata: { source: 'txt' },
            }),
          ];
          break;
        }
        default:
          throw new Error(`Unsupported mime type for indexing: ${mimeType}`);
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
      });

      const docsWithMeta = docs.map(
        (d) =>
          new Document({
            pageContent: d.pageContent,
            metadata: {
              ...d.metadata,
              fileId,
              workspaceId,
              userId,
              source: sourceLabel,
            },
          }),
      );

      const chunks = await splitter.splitDocuments(docsWithMeta);

      await this.aiService.addDocumentsToVectorStore(chunks);
      this.logger.log(
        `Indexed ${chunks.length} chunk(s) from ${docs.length} document part(s) (${mimeType}) for workspace ${workspaceId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Failed to process file job ${job.id}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async extractTextFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractTextFromTXT(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }
}
