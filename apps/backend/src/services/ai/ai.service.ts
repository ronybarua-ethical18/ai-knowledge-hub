import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { TaskType } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.config';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private embeddings: GoogleGenerativeAIEmbeddings;
  private vectorStore: QdrantVectorStore;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.initializeEmbeddings();
    this.initializeGenAI();
  }

  private async initializeEmbeddings() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: 'Document title',
      apiKey: env.config.GEMINI_API_KEY,
    });
  }

  private initializeGenAI() {
    this.genAI = new GoogleGenerativeAI(env.config.GEMINI_API_KEY);
  }

  async initializeVectorStore(): Promise<void> {
    if (!this.vectorStore) {
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: env.config.QDRANT_URL,
          collectionName: 'file-collection',
        },
      );
    }
  }

  async addDocumentsToVectorStore(documents: Document[]): Promise<void> {
    try {
      await this.initializeVectorStore();
      await this.vectorStore.addDocuments(documents);
      this.logger.log(`Successfully added ${documents.length} documents to vector store`);
    } catch (error) {
      this.logger.error('Failed to add documents to vector store:', error);
      throw error;
    }
  }

  async searchSimilarDocuments(query: string, limit: number = 5): Promise<Document[]> {
    try {
      await this.initializeVectorStore();
      const results = await this.vectorStore.similaritySearch(query, limit);
      return results;
    } catch (error) {
      this.logger.error('Failed to search similar documents:', error);
      throw error;
    }
  }

  async chatWithDocuments(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const { message, limit = 5 } = chatRequest;

      // Get relevant documents from Qdrant
      const documents = await this.searchSimilarDocuments(message, limit);

      // Prepare context from retrieved documents
      const context = documents
        .map((doc, index) => `Document ${index + 1}:\n${doc.pageContent}`)
        .join('\n\n');

      // Create the prompt for the AI
      const prompt = this.buildChatPrompt(message, context);

      // Generate response using Gemini
      let response: string;
      try {
        const model = this.genAI.getGenerativeModel({ model: env.config.GEMINI_CHAT_MODEL });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } catch (modelError) {
        this.logger.warn(`Failed to use ${env.config.GEMINI_CHAT_MODEL}, trying gemini-pro:`, modelError);
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
          const result = await model.generateContent(prompt);
          response = result.response.text();
        } catch (fallbackError) {
          this.logger.error('All Gemini models failed, using fallback response:', fallbackError);
          // Create a simple response based on the retrieved documents
          if (documents.length > 0) {
            const firstDoc = documents[0];
            const preview = firstDoc.pageContent.substring(0, 200);
            response = `I found ${documents.length} relevant document(s) related to your query. Here's a preview from the most relevant one: "${preview}${firstDoc.pageContent.length > 200 ? '...' : ''}"`;
          } else {
            response = `I couldn't find any relevant information in the uploaded documents for your query: "${message}". Please try rephrasing your question or upload more documents.`;
          }
        }
      }

      // Format references
      const references = documents.map(doc => ({
        content: doc.pageContent,
        source: doc.metadata?.source || 'Unknown'
      }));

      return {
        response,
        references
      };

    } catch (error) {
      this.logger.error('Failed to process chat request:', error);
      throw error;
    }
  }

  private buildChatPrompt(userMessage: string, context: string): string {
    return `
You are an AI assistant that helps users find information from their uploaded documents. 
Use the provided context from the documents to answer questions accurately and helpfully.

Context from documents:
${context}

User question: ${userMessage}

Instructions:
1. Answer based on the provided context from the documents
2. If the answer is not in the context, say so clearly
3. Be concise and conversational
4. Provide a helpful response that directly addresses the user's question

Response:`;
  }

  getEmbeddings(): GoogleGenerativeAIEmbeddings {
    return this.embeddings;
  }

  getVectorStore(): QdrantVectorStore {
    return this.vectorStore;
  }
}