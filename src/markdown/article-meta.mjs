/**
 * Parse trailing HTML comment markers inside list items:
 *   <!-- article id="2026-11-13-gemini-4-hydrogen" tags="AI,科技,产品" -->
 *
 * Satteri keeps these as hast `raw` nodes. Use ctx.setProperty / removeChildAt
 * (nodes are read-only stubs).
 */

const ARTICLE_COMMENT_RE =
  /^<!--\s*article\s+id=["']([a-z0-9][a-z0-9-]{2,80})["']\s+tags=["']([^"']+)["']\s*-->$/i;

const ARTICLE_INNER_RE =
  /^article\s+id=["']([a-z0-9][a-z0-9-]{2,80})["']\s+tags=["']([^"']+)["']\s*$/i;

/**
 * @param {string} value
 * @returns {{ id: string, tags: string } | null}
 */
export function parseArticleMetaComment(value) {
  const trimmed = String(value ?? '').trim();
  const wrapped = ARTICLE_COMMENT_RE.exec(trimmed);
  if (wrapped) return { id: wrapped[1], tags: wrapped[2].trim() };
  const inner = ARTICLE_INNER_RE.exec(trimmed);
  if (inner) return { id: inner[1], tags: inner[2].trim() };
  return null;
}

/**
 * @returns {{ name: string, element: { filter: string[], visit: Function } }}
 */
export function articleMetaHastPlugin() {
  return {
    name: 'article-meta',
    element: {
      filter: ['li'],
      /**
       * @param {import('hast').Element} node
       * @param {{
       *   setProperty: (node: import('hast').Element, key: string, value: unknown) => void,
       *   removeChildAt: (node: import('hast').Element, index: number) => void,
       * }} ctx
       */
      visit(node, ctx) {
        if (!Array.isArray(node.children)) return;

        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (!child || typeof child !== 'object') continue;
          if (child.type !== 'raw' && child.type !== 'comment') continue;
          const meta = parseArticleMetaComment(child.value);
          if (!meta) continue;

          ctx.setProperty(node, 'dataArticleId', meta.id);
          ctx.setProperty(node, 'dataTags', meta.tags);
          ctx.setProperty(
            node,
            'className',
            mergeClass(node.properties?.className, 'has-article-feedback'),
          );
          ctx.removeChildAt(node, i);
          return;
        }
      },
    },
  };
}

/**
 * @param {unknown} existing
 * @param {string} extra
 */
function mergeClass(existing, extra) {
  if (Array.isArray(existing)) {
    return existing.includes(extra) ? existing : [...existing, extra];
  }
  if (typeof existing === 'string' && existing.trim()) {
    return existing.split(/\s+/).includes(extra) ? existing : `${existing} ${extra}`;
  }
  return extra;
}

export { ARTICLE_COMMENT_RE, ARTICLE_INNER_RE };
