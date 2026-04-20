import { Injectable, Logger } from '@nestjs/common';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from '@langchain/core/documents';
import type { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiError } from '../../common/exceptions/api-error.exception';
import { env } from '../../config/env.config';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { GeminiApiEmbeddings } from './gemini-api.embeddings';
import { workspaceFilter } from './qdrant-chat.filters';
import { ensureWorkspacePayloadIndex } from './qdrant-workspace-payload-index';

/** Tried in order after GEMINI_CHAT_MODEL (404 / quota / etc.). Duplicates removed at runtime. */
const GEMINI_CHAT_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private embeddings: Embeddings;
  private vectorStore: QdrantVectorStore;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.initializeEmbeddings();
    this.initializeGenAI();
  }

  private async initializeEmbeddings() {
    // gemini-embedding-001 is the current Gemini API embedding model for AI Studio keys.
    // Override via GEMINI_EMBEDDING_MODEL. If you change models, recreate the Qdrant collection
    // if vector size differs.
    this.embeddings = new GeminiApiEmbeddings({
      model: env.config.GEMINI_EMBEDDING_MODEL,
      apiKey: env.config.GEMINI_API_KEY,
    });
  }

  private initializeGenAI() {
    this.genAI = new GoogleGenerativeAI(env.config.GEMINI_API_KEY);
  }

  private static qdrantConnectionArgs(): {
    url: string;
    collectionName: string;
    apiKey?: string;
  } {
    const { QDRANT_URL, QDRANT_API_KEY } = env.config;
    return {
      url: QDRANT_URL,
      collectionName: 'file-collection',
      ...(QDRANT_API_KEY.trim() !== '' ? { apiKey: QDRANT_API_KEY } : {}),
    };
  }

  async initializeVectorStore(): Promise<void> {
    if (!this.vectorStore) {
      const args = AiService.qdrantConnectionArgs();
      const client = new QdrantClient({
        url: args.url,
        ...(args.apiKey ? { apiKey: args.apiKey } : {}),
      });
      await ensureWorkspacePayloadIndex(
        client,
        args.collectionName,
        this.logger,
      );
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        args,
      );
    }
  }

  async addDocumentsToVectorStore(documents: Document[]): Promise<void> {
    try {
      await this.initializeVectorStore();
      await this.vectorStore.addDocuments(documents);
      this.logger.log(
        `Successfully added ${documents.length} documents to vector store`,
      );
    } catch (error) {
      this.logger.error('Failed to add documents to vector store:', error);
      throw error;
    }
  }

  async searchSimilarDocuments(
    query: string,
    limit: number = 5,
    workspaceId: string,
  ): Promise<Document[]> {
    try {
      await this.initializeVectorStore();
      const filter = workspaceFilter(workspaceId);
      const results = await this.vectorStore.similaritySearch(
        query,
        limit,
        filter,
      );
      return results;
    } catch (error) {
      this.logger.error('Failed to search similar documents:', error);
      throw error;
    }
  }

  async chatWithDocuments(
    chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      const { message, limit = 5, workspaceId } = chatRequest;

      if (!workspaceId?.trim()) {
        throw ApiError.badRequest('workspaceId is required for document chat');
      }

      const effectiveLimit =
        /\bcard\s*holder|cardholder|passenger\s*name|name\s+of\s+(?:the\s+)?(?:card|passenger|cardholder)\b/i.test(
          message,
        )
          ? Math.max(limit, 12)
          : limit;

      const documents = await this.searchSimilarDocuments(
        message,
        effectiveLimit,
        workspaceId,
      );

      if (documents.length === 0) {
        return {
          response:
            'I could not find any relevant passages in documents for this workspace. Upload files (PDF, DOCX, or TXT) in the same workspace and try again, or rephrase your question.',
          references: [],
        };
      }

      const context = documents
        .map((doc, index) => {
          const src =
            (doc.metadata?.source as string) ||
            (doc.metadata?.fileId as string) ||
            'unknown';
          return `Excerpt ${index + 1} (source: ${src}):\n${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      const prompt = this.buildChatPrompt(message, context);

      const modelChain = [
        env.config.GEMINI_CHAT_MODEL,
        ...GEMINI_CHAT_FALLBACK_MODELS,
      ];
      const modelsToTry = [...new Set(modelChain)];

      let response: string | undefined;
      let lastModelError: unknown;

      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          response = result.response.text();
          break;
        } catch (err) {
          lastModelError = err;
          this.logger.warn(
            `Gemini model "${modelName}" failed, trying next:`,
            err,
          );
        }
      }

      if (response === undefined) {
        this.logger.error(
          'All Gemini models failed; using offline extraction + user message.',
          lastModelError,
        );
        response = this.buildResponseWithoutLlm(message, documents);
      }

      // Format references
      const references = documents.map((doc) => ({
        content: doc.pageContent,
        source:
          (doc.metadata?.source as string) ||
          (doc.metadata?.fileId as string) ||
          'Unknown',
      }));

      return {
        response,
        references,
      };
    } catch (error) {
      this.logger.error('Failed to process chat request:', error);
      throw error;
    }
  }

  /**
   * When every Gemini model fails (quota, outage), avoid misleading regex dumps from a single chunk.
   * Optionally pulls short labeled lines (e.g. passenger / cardholder) from all retrieved excerpts.
   */
  private buildResponseWithoutLlm(
    question: string,
    documents: Document[],
  ): string {
    const extracted = this.tryExtractAnswerFromDocuments(question, documents);
    const aiUnavailable =
      'The AI service could not generate an answer (quota, rate limit, or temporary error). ';
    if (extracted) {
      return (
        aiUnavailable +
        `From the retrieved text, this line may be relevant: ${extracted} ` +
        'Please confirm against the full document in References.'
      );
    }
    return (
      aiUnavailable +
      'The retrieved passages did not contain an obvious labeled answer to your question. ' +
      'Check the References below, or retry after a few minutes when the AI service is available.'
    );
  }

  /**
   * Best-effort pattern match across all chunks (retrieval order is not always best for names).
   */
  private tryExtractAnswerFromDocuments(
    question: string,
    documents: Document[],
  ): string | null {
    const q = question.toLowerCase();
    const text = documents.map((d) => d.pageContent).join('\n\n');

    const tryPatterns = (regexes: RegExp[]): string | null => {
      for (const re of regexes) {
        const m = text.match(re);
        if (m?.[1]) {
          const value = m[1].trim().replace(/\s+/g, ' ');
          if (value.length >= 2 && value.length < 400) {
            return value;
          }
        }
      }
      return null;
    };

    if (
      /\bcard\s*holder\b|\bcardholder\b/.test(q) ||
      (q.includes('name') &&
        (q.includes('card') || q.includes('ticket') || q.includes('payment')))
    ) {
      const hit = tryPatterns([
        /(?:card\s*holder|cardholder)\s*[:\s]+([^\n\r]+)/i,
        /(?:passenger|pax)\s*name\s*[:\s]+([^\n\r]+)/i,
        /name\s+of\s+(?:passenger|cardholder)\s*[:\s]+([^\n\r]+)/i,
        /(?:passenger|traveller|traveler)\s*[:\s]+([^\n\r]+)/i,
      ]);
      if (hit) {
        return hit;
      }
    }

    if (/\bauthor\b|who\s+wrote/.test(q)) {
      const hit = tryPatterns([/(?:author|written\s+by)\s*[:\s]+([^\n\r]+)/i]);
      if (hit) {
        return hit;
      }
    }

    return null;
  }

  private buildChatPrompt(userMessage: string, context: string): string {
    return `You answer questions using ONLY the excerpts below from the user's workspace documents. If the answer is not contained in the excerpts, say you cannot find it in the uploaded materials—do not invent facts.

Excerpts:
${context}

Question: ${userMessage}

Answer concisely. For questions about a passenger or cardholder name on tickets or receipts, look for labels such as PASSENGER NAME, Name, Cardholder, or PAYMENT/CARD lines and quote the exact text only if it appears in the excerpts. Mention which source label the information comes from when relevant.`;
  }

  getEmbeddings(): Embeddings {
    return this.embeddings;
  }

  getVectorStore(): QdrantVectorStore {
    return this.vectorStore;
  }
}
