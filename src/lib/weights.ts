import type { Tag } from './tags';

export type Vote = 'like' | 'dislike';
export type WeightMap = Record<string, number>;

export type FeedbackEvent = {
  ts: string;
  articleId: string;
  tags: Tag[];
  vote: Vote | null;
  previousVote: Vote | null;
};

export type WeightDocument = {
  version: 1;
  updatedAt: string;
  weights: WeightMap;
  events: FeedbackEvent[];
};

const MAX_EVENTS = 500;

function deltaFor(vote: Vote | null): number {
  if (vote === 'like') return 1;
  if (vote === 'dislike') return -1;
  return 0;
}

/**
 * Apply a vote transition to a tag-weight map.
 * Removes the effect of `previousVote`, then applies `vote`.
 * Both null → no change. Same vote twice → no change.
 */
export function applyVote(
  weights: WeightMap,
  tags: readonly string[],
  previousVote: Vote | null,
  vote: Vote | null,
): WeightMap {
  const next: WeightMap = { ...weights };
  if (previousVote === vote) return next;

  const remove = deltaFor(previousVote);
  const add = deltaFor(vote);

  for (const tag of tags) {
    const current = next[tag] ?? 0;
    next[tag] = current - remove + add;
  }
  return next;
}

export type Candidate = {
  id: string;
  tags: readonly string[];
};

export type ScoredCandidate = Candidate & { score: number };

/** Sum of the item's tag weights; missing tags count as 0. */
export function scoreCandidate(candidate: Candidate, weights: WeightMap): number {
  let score = 0;
  for (const tag of candidate.tags) {
    score += weights[tag] ?? 0;
  }
  return score;
}

/** Rank candidates by score descending. Never filters — tilt only. */
export function scoreCandidates(
  candidates: readonly Candidate[],
  weights: WeightMap,
): ScoredCandidate[] {
  return candidates
    .map((c) => ({ ...c, score: scoreCandidate(c, weights) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function emptyWeightState(): WeightDocument {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    weights: {},
    events: [],
  };
}

export function appendEvent(
  doc: WeightDocument,
  event: FeedbackEvent,
  nextWeights: WeightMap,
): WeightDocument {
  const events = [...doc.events, event];
  while (events.length > MAX_EVENTS) events.shift();
  return {
    version: 1,
    updatedAt: event.ts,
    weights: nextWeights,
    events,
  };
}
