import { describe, expect, it } from 'vitest';
import { parseFeedbackBody } from './feedback-input';

describe('parseFeedbackBody', () => {
  it('accepts a valid like payload', () => {
    const parsed = parseFeedbackBody({
      articleId: '2026-11-13-gemini-4-hydrogen',
      tags: ['AI', '科技'],
      vote: 'like',
      previousVote: null,
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.vote).toBe('like');
      expect(parsed.value.tags).toEqual(['AI', '科技']);
    }
  });

  it('rejects unknown tags', () => {
    const parsed = parseFeedbackBody({
      articleId: '2026-11-13-gemini-4-hydrogen',
      tags: ['AI', '未知'],
      vote: 'like',
      previousVote: null,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects bad articleId', () => {
    const parsed = parseFeedbackBody({
      articleId: 'Bad Id!',
      tags: ['AI'],
      vote: 'dislike',
      previousVote: null,
    });
    expect(parsed.ok).toBe(false);
  });

  it('allows clearing a vote with null', () => {
    const parsed = parseFeedbackBody({
      articleId: '2026-11-13-gemini-4-hydrogen',
      tags: ['AI'],
      vote: null,
      previousVote: 'like',
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.vote).toBeNull();
  });
});
