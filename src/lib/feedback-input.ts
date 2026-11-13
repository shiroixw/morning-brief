import { parseTags, type Tag } from './tags';
import type { Vote } from './weights';

const ARTICLE_ID_RE = /^[a-z0-9][a-z0-9-]{2,80}$/;

export type FeedbackBody = {
  articleId: string;
  tags: Tag[];
  vote: Vote | null;
  previousVote: Vote | null;
};

function parseVote(value: unknown): Vote | null | undefined {
  if (value === null) return null;
  if (value === 'like' || value === 'dislike') return value;
  return undefined;
}

export function parseFeedbackBody(raw: unknown): { ok: true; value: FeedbackBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Body must be a JSON object' };
  }
  const body = raw as Record<string, unknown>;

  if (typeof body.articleId !== 'string' || !ARTICLE_ID_RE.test(body.articleId)) {
    return { ok: false, error: 'Invalid articleId' };
  }

  const tags = parseTags(body.tags);
  if (!tags) {
    return { ok: false, error: 'Invalid tags' };
  }

  const vote = parseVote(body.vote);
  if (vote === undefined) {
    return { ok: false, error: 'vote must be like, dislike, or null' };
  }

  const previousVote = parseVote(body.previousVote);
  if (previousVote === undefined) {
    return { ok: false, error: 'previousVote must be like, dislike, or null' };
  }

  return {
    ok: true,
    value: {
      articleId: body.articleId,
      tags,
      vote,
      previousVote,
    },
  };
}
