import type { Schemas } from '@qdrant/js-client-rest';

/** LangChain stores `Document.metadata` under Qdrant payload `metadata`; filters use dotted paths. */
export const WORKSPACE_PAYLOAD_FIELD = 'metadata.workspaceId';

/**
 * Restrict vector search to embeddings ingested for a single workspace
 * (metadata.workspaceId is set in FileProcessorWorker).
 */
export function workspaceFilter(workspaceId: string): Schemas['Filter'] {
  return {
    must: [
      {
        key: WORKSPACE_PAYLOAD_FIELD,
        match: { value: workspaceId },
      },
    ],
  };
}
