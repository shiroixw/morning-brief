import { describe, expect, it } from 'vitest';
import { DISLIKE_LABEL, LIKE_LABEL } from './article-feedback';

describe('article feedback button labels', () => {
  it('uses 点赞 / 点踩 as the visible control labels', () => {
    expect(LIKE_LABEL).toBe('点赞');
    expect(DISLIKE_LABEL).toBe('点踩');
  });

  it('does not use the previous 喜欢 / 不喜欢 labels', () => {
    expect(LIKE_LABEL).not.toBe('喜欢');
    expect(DISLIKE_LABEL).not.toBe('不喜欢');
  });
});
