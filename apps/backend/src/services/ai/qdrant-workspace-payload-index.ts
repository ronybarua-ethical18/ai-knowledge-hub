import type { QdrantClient } from '@qdrant/js-client-rest';
import type { Logger } from '@nestjs/common';
import { WORKSPACE_PAYLOAD_FIELD } from './qdrant-chat.filters';

/**
 * Qdrant Cloud requires a payload index on any field used in query filters.
 * Ensures `metadata.workspaceId` is indexed (uuid) so workspace-scoped RAG works.
 */
export async function ensureWorkspacePayloadIndex(
  client: QdrantClient,
  collectionName: string,
  logger?: Logger,
): Promise<void> {
  let exists = false;
  try {
    const info = await client.getCollection(collectionName);
    exists = Boolean(info.payload_schema?.[WORKSPACE_PAYLOAD_FIELD]);
  } catch (e) {
    logger?.warn(
      `ensureWorkspacePayloadIndex: could not read collection ${collectionName}`,
      e,
    );
    throw e;
  }

  if (exists) {
    return;
  }

  try {
    await client.createPayloadIndex(collectionName, {
      field_name: WORKSPACE_PAYLOAD_FIELD,
      field_schema: 'uuid',
      wait: true,
    });
    logger?.log(
      `Created Qdrant payload index on ${WORKSPACE_PAYLOAD_FIELD} (required for filtered search on Cloud).`,
    );
  } catch (e: unknown) {
    const dataErr =
      e &&
      typeof e === 'object' &&
      'data' in e &&
      typeof (e as { data?: { status?: { error?: string } } }).data?.status
        ?.error === 'string'
        ? (e as { data: { status: { error: string } } }).data.status.error
        : '';
    const message = e instanceof Error ? e.message : String(e);
    if (
      /already exists|field already|duplicate|409/i.test(
        `${message} ${dataErr}`,
      )
    ) {
      return;
    }
    throw e;
  }
}
