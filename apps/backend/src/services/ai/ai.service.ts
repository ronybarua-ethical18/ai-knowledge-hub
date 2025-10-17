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
  ): Promise<Document[]> {
    try {
      await this.initializeVectorStore();
      const results = await this.vectorStore.similaritySearch(query, limit);
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
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
        });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } catch (modelError) {
        this.logger.warn(
          `Failed to use ${env.config.GEMINI_CHAT_MODEL}, trying gemini-1.5-pro:`,
          modelError,
        );
        try {
          const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
          });
          const result = await model.generateContent(prompt);
          response = result.response.text();
        } catch (fallbackError) {
          this.logger.error(
            'All Gemini models failed, using fallback response:',
            fallbackError,
          );
          // Create a smarter response based on the retrieved documents and user question
          if (documents.length > 0) {
            const firstDoc = documents[0];
            const content = firstDoc.pageContent.toLowerCase();
            const question = message.toLowerCase();

            // Try to extract specific information based on common question patterns
            if (
              question.includes('author') ||
              question.includes('writer') ||
              question.includes('who wrote')
            ) {
              // Look for author patterns in the document
              const authorMatch = firstDoc.pageContent.match(
                /(?:author|writer|by)\s*:?\s*([^\n\r,]+)/i,
              );
              if (authorMatch) {
                response = `The author is ${authorMatch[1].trim()}.`;
              } else {
                response = `I found the document but couldn't identify a specific author name. Here's what I found: "${firstDoc.pageContent.substring(0, 200)}..."`;
              }
            } else if (
              question.includes('name') &&
              (question.includes('what') || question.includes('tell me'))
            ) {
              // Look for name patterns
              const nameMatch = firstDoc.pageContent.match(
                /(?:name|Name)\s*:?\s*([^\n\r,]+)/i,
              );
              if (nameMatch) {
                response = `The name is ${nameMatch[1].trim()}.`;
              } else {
                response = `I found the document but couldn't identify a specific name. Here's what I found: "${firstDoc.pageContent.substring(0, 200)}..."`;
              }
            } else {
              // Generic response for other questions
              response = `Based on the uploaded document, here's what I found: "${firstDoc.pageContent.substring(0, 200)}..."`;
            }
          } else {
            response = `I couldn't find any relevant information in the uploaded documents for your query: "${message}". Please try rephrasing your question or upload more documents.`;
          }
        }
      }

      // Format references
      const references = documents.map((doc) => ({
        content: doc.pageContent,
        source: doc.metadata?.source || 'Unknown',
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

  private buildChatPrompt(userMessage: string, context: string): string {
    return `
  You are a helpful assistant that analyzes uploaded documents and answers questions about them in a natural, human-like way.
  
  Context from the uploaded documents:
  ${context}
  
  User question: ${userMessage}
  
  Instructions:
  1. Answer the user's question directly and naturally, as if you're a knowledgeable person who has read the documents
  2. If they ask for specific information (like names, dates, numbers), provide the exact answer
  3. If they ask "what is the author name?" or "who wrote this?", extract and provide the exact name
  4. Be conversational and helpful - respond like a human would
  5. If the information isn't in the documents, say so clearly
  6. Don't just summarize - give direct answers to specific questions
  
  Response:`;
  }

  getEmbeddings(): GoogleGenerativeAIEmbeddings {
    return this.embeddings;
  }

  getVectorStore(): QdrantVectorStore {
    return this.vectorStore;
  }
}
