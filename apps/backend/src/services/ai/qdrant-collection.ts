import type { QdrantClient } from '@qdrant/js-client-rest';
import type { Logger } from '@nestjs/common';
import type { Embeddings } from '@langchain/core/embeddings';

/** Gemini embeddings use cosine similarity for retrieval. */
const QDRANT_DISTANCE = 'Cosine' as const;

/**
 * Create the Qdrant collection on first use if it does not exist yet.
 *
 * `QdrantVectorStore.fromExistingCollection` throws when the collection is missing,
 * so a fresh Qdrant instance (or a new deployment) has no way to bootstrap itself.
 * The vector size is probed from the configured embedding model at runtime so it
 * stays correct if GEMINI_EMBEDDING_MODEL (and thus the dimension) changes.
 */
export async function ensureCollectionExists(
  client: QdrantClient,
  collectionName: string,
  embeddings: Embeddings,
  logger?: Logger,
): Promise<void> {
  try {
    await client.getCollection(collectionName);
    return; // already exists
  } catch (e: unknown) {
    if (!isNotFoundError(e)) {
      logger?.warn(
        `ensureCollectionExists: unexpected error reading collection ${collectionName}`,
        e,
      );
      throw e;
    }
  }

  const probe = await embeddings.embedQuery('dimension probe');
  const vectorSize = probe.length;
  if (!vectorSize) {
    throw new Error(
      'ensureCollectionExists: embedding model returned an empty vector; cannot size the collection',
    );
  }

  try {
    await client.createCollection(collectionName, {
      vectors: { size: vectorSize, distance: QDRANT_DISTANCE },
    });
    logger?.log(
      `Created Qdrant collection ${collectionName} (size=${vectorSize}, distance=${QDRANT_DISTANCE}).`,
    );
  } catch (e: unknown) {
    // Another instance may have created it concurrently.
    if (isConflictError(e)) {
      return;
    }
    throw e;
  }
}

function isNotFoundError(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (status === 404) return true;
  const message = e instanceof Error ? e.message : String(e);
  return /not found|doesn't exist|does not exist|404/i.test(message);
}

function isConflictError(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (status === 409) return true;
  const message = e instanceof Error ? e.message : String(e);
  return /already exists|conflict|409/i.test(message);
}
