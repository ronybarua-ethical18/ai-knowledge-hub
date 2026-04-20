import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBED_MAX_RETRIES = 8;
const EMBED_BASE_BACKOFF_MS = 2000;
const EMBED_MAX_BACKOFF_MS = 60_000;
/** Space out bulk index calls (free-tier embedding RPM is low). */
const EMBED_INTER_REQUEST_DELAY_MS = 450;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableEmbedError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const status = (err as { status?: number }).status;
  if (status === 429 || status === 503) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /resource exhausted|too many requests|429|503/i.test(msg);
}

async function withEmbeddingRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < EMBED_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const canRetry =
        isRetryableEmbedError(e) && attempt < EMBED_MAX_RETRIES - 1;
      if (!canRetry) throw e;
      const backoff = Math.min(
        EMBED_BASE_BACKOFF_MS * 2 ** attempt + Math.floor(Math.random() * 500),
        EMBED_MAX_BACKOFF_MS,
      );
      await sleep(backoff);
    }
  }
  throw last;
}

/**
 * Thin Embeddings adapter using @google/generative-ai directly.
 * Uses current Gemini embedding model IDs (e.g. gemini-embedding-001) that expose :embedContent
 * on the Generative Language API — LangChain's wrapper can 404 on older model names.
 *
 * Retries on 429/503 with backoff and spaces bulk embeds to reduce free-tier rate limits.
 */
export class GeminiApiEmbeddings extends Embeddings {
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(options: { apiKey: string; model: string }) {
    super({});
    const genAI = new GoogleGenerativeAI(options.apiKey);
    this.model = genAI.getGenerativeModel({ model: options.model });
  }

  async embedQuery(text: string): Promise<number[]> {
    return withEmbeddingRetry(async () => {
      const cleaned = text.replace(/\n/g, ' ');
      const res = await this.model.embedContent(cleaned);
      const values = res.embedding?.values;
      if (!values?.length) {
        throw new Error('Gemini returned an empty embedding');
      }
      return values;
    });
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < documents.length; i++) {
      out.push(await this.embedQuery(documents[i]));
      if (i < documents.length - 1) {
        await sleep(EMBED_INTER_REQUEST_DELAY_MS);
      }
    }
    return out;
  }
}
