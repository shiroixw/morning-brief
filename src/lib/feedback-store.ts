import { get, put } from '@vercel/blob';
import type { Tag } from './tags';
import {
  appendEvent,
  applyVote,
  emptyWeightState,
  type Vote,
  type WeightDocument,
} from './weights';

export const FEEDBACK_BLOB_PATH = 'feedback/weights.json';

export type BlobAvailability =
  | { ok: true; mode: 'oidc' | 'token' }
  | { ok: false; reason: string };

/** Lazy check — never throws; builds stay green when Blob env is missing. */
export function getBlobAvailability(): BlobAvailability {
  if (process.env.BLOB_STORE_ID || process.env.VERCEL_OIDC_TOKEN) {
    if (process.env.BLOB_STORE_ID) return { ok: true, mode: 'oidc' };
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: true, mode: 'token' };
  }
  return {
    ok: false,
    reason: 'Missing BLOB_STORE_ID (OIDC) or BLOB_READ_WRITE_TOKEN',
  };
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

function isWeightDocument(value: unknown): value is WeightDocument {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    typeof v.updatedAt === 'string' &&
    typeof v.weights === 'object' &&
    v.weights !== null &&
    Array.isArray(v.events)
  );
}

export async function readWeightDocument(): Promise<{
  doc: WeightDocument;
  etag: string | null;
}> {
  const availability = getBlobAvailability();
  if (!availability.ok) {
    throw new Error(availability.reason);
  }

  const result = await get(FEEDBACK_BLOB_PATH, {
    access: 'private',
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return { doc: emptyWeightState(), etag: null };
  }

  const text = await streamToText(result.stream);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { doc: emptyWeightState(), etag: result.blob.etag ?? null };
  }

  if (!isWeightDocument(parsed)) {
    return { doc: emptyWeightState(), etag: result.blob.etag ?? null };
  }

  return { doc: parsed, etag: result.blob.etag ?? null };
}

export async function writeWeightDocument(
  doc: WeightDocument,
  etag: string | null,
): Promise<void> {
  const availability = getBlobAvailability();
  if (!availability.ok) {
    throw new Error(availability.reason);
  }

  const body = JSON.stringify(doc, null, 2);
  await put(FEEDBACK_BLOB_PATH, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

export type RecordFeedbackInput = {
  articleId: string;
  tags: Tag[];
  vote: Vote | null;
  previousVote: Vote | null;
};

export async function recordFeedback(input: RecordFeedbackInput): Promise<WeightDocument> {
  const { doc, etag } = await readWeightDocument();
  const nextWeights = applyVote(doc.weights, input.tags, input.previousVote, input.vote);
  const event = {
    ts: new Date().toISOString(),
    articleId: input.articleId,
    tags: input.tags,
    vote: input.vote,
    previousVote: input.previousVote,
  };
  const next = appendEvent(doc, event, nextWeights);

  try {
    await writeWeightDocument(next, etag);
  } catch (err) {
    // One retry without ifMatch on precondition failure / race
    const message = err instanceof Error ? err.message : String(err);
    if (/precondition|412|conflict/i.test(message)) {
      const fresh = await readWeightDocument();
      const retriedWeights = applyVote(
        fresh.doc.weights,
        input.tags,
        input.previousVote,
        input.vote,
      );
      const retried = appendEvent(fresh.doc, event, retriedWeights);
      await writeWeightDocument(retried, null);
      return retried;
    }
    throw err;
  }

  return next;
}
