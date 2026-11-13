import { describe, expect, it } from 'vitest';
import {
  ARTICLE_INNER_RE,
  articleMetaHastPlugin,
  parseArticleMetaComment,
} from './article-meta.mjs';

describe('parseArticleMetaComment', () => {
  it('parses a raw HTML comment string', () => {
    const parsed = parseArticleMetaComment(
      '<!-- article id="2026-11-13-gemini-4-hydrogen" tags="AI,科技,产品" -->',
    );
    expect(parsed).toEqual({
      id: '2026-11-13-gemini-4-hydrogen',
      tags: 'AI,科技,产品',
    });
  });

  it('parses an inner comment value', () => {
    const match = ARTICLE_INNER_RE.exec(
      'article id="2026-11-13-gemini-4-hydrogen" tags="AI,科技,产品"',
    );
    expect(match?.[1]).toBe('2026-11-13-gemini-4-hydrogen');
  });
});

describe('articleMetaHastPlugin', () => {
  it('uses ctx to set data attrs and remove the raw comment', () => {
    const plugin = articleMetaHastPlugin();
    const li = {
      type: 'element',
      tagName: 'li',
      properties: {},
      children: [
        { type: 'text', value: 'Article body' },
        {
          type: 'raw',
          value: '<!-- article id="2026-11-13-lca-nondubito" tags="科学" -->',
        },
      ],
    };

    const calls = [];
    plugin.element.visit(li, {
      setProperty(_node, key, value) {
        calls.push(['set', key, value]);
      },
      removeChildAt(_node, index) {
        calls.push(['remove', index]);
      },
    });

    expect(calls).toEqual([
      ['set', 'dataArticleId', '2026-11-13-lca-nondubito'],
      ['set', 'dataTags', '科学'],
      ['set', 'className', 'has-article-feedback'],
      ['remove', 1],
    ]);
  });
});
