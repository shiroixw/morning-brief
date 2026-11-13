import { describe, expect, it } from 'vitest';
import {
  applyVote,
  emptyWeightState,
  scoreCandidate,
  scoreCandidates,
  type Vote,
  type WeightMap,
} from './weights';

describe('applyVote', () => {
  it('like increments each tag by 1', () => {
    const next = applyVote({}, ['AI', '科技'], null, 'like');
    expect(next).toEqual({ AI: 1, 科技: 1 });
  });

  it('dislike decrements each tag by 1', () => {
    const next = applyVote({ AI: 2 }, ['AI', '人文'], null, 'dislike');
    expect(next).toEqual({ AI: 1, 人文: -1 });
  });

  it('undo like removes the previous +1', () => {
    const start: WeightMap = { AI: 1, 科技: 1 };
    const next = applyVote(start, ['AI', '科技'], 'like', null);
    expect(next).toEqual({ AI: 0, 科技: 0 });
  });

  it('undo dislike removes the previous -1', () => {
    const start: WeightMap = { 人文: -1 };
    const next = applyVote(start, ['人文'], 'dislike', null);
    expect(next).toEqual({ 人文: 0 });
  });

  it('switch like → dislike reverses then applies', () => {
    const start: WeightMap = { AI: 1, 产品: 1 };
    const next = applyVote(start, ['AI', '产品'], 'like', 'dislike');
    expect(next).toEqual({ AI: -1, 产品: -1 });
  });

  it('switch dislike → like reverses then applies', () => {
    const start: WeightMap = { 科学: -1 };
    const next = applyVote(start, ['科学'], 'dislike', 'like');
    expect(next).toEqual({ 科学: 1 });
  });

  it('no-op when vote equals previousVote', () => {
    const start: WeightMap = { AI: 3 };
    const next = applyVote(start, ['AI'], 'like', 'like');
    expect(next).toEqual({ AI: 3 });
  });

  it('does not mutate the input map', () => {
    const start: WeightMap = { AI: 1 };
    const next = applyVote(start, ['AI'], null, 'like');
    expect(start).toEqual({ AI: 1 });
    expect(next).toEqual({ AI: 2 });
  });
});

describe('scoreCandidates', () => {
  it('scores by sum of tag weights, missing tags default to 0', () => {
    const weights: WeightMap = { AI: 2, 人文: -1 };
    expect(scoreCandidate({ id: 'a', tags: ['AI', '科技'] }, weights)).toBe(2);
    expect(scoreCandidate({ id: 'b', tags: ['人文'] }, weights)).toBe(-1);
    expect(scoreCandidate({ id: 'c', tags: ['生活'] }, weights)).toBe(0);
  });

  it('sorts candidates by score descending without dropping any', () => {
    const weights: WeightMap = { AI: 3, 人文: -2, 开发: 1 };
    const ranked = scoreCandidates(
      [
        { id: 'slow', tags: ['人文', '生活'] },
        { id: 'dev', tags: ['开发'] },
        { id: 'model', tags: ['AI', '科技'] },
      ],
      weights,
    );
    expect(ranked.map((r) => r.id)).toEqual(['model', 'dev', 'slow']);
    expect(ranked.map((r) => r.score)).toEqual([3, 1, -2]);
  });
});

describe('emptyWeightState', () => {
  it('returns versioned empty document shape', () => {
    const state = emptyWeightState();
    expect(state.version).toBe(1);
    expect(state.weights).toEqual({});
    expect(state.events).toEqual([]);
  });
});

describe('Vote type guards via applyVote edges', () => {
  const votes: Vote[] = ['like', 'dislike'];
  it('accepts like and dislike', () => {
    expect(votes).toContain('like');
    expect(votes).toContain('dislike');
  });
});
