/**
 * Site-wide Markdown hast plugin: open HTTP(S) external article/source links
 * in a new tab with rel="noopener noreferrer". Internal paths, fragments, and
 * same-origin absolute URLs stay in the current tab.
 *
 * @param {string | URL | undefined} site
 */
export function externalLinksHastPlugin(site) {
  let siteOrigin = null;
  if (site) {
    try {
      siteOrigin = new URL(site).origin;
    } catch {
      siteOrigin = null;
    }
  }

  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      /**
       * @param {import('hast').Element} node
       * @param {{ setProperty: (node: import('hast').Element, key: string, value: unknown) => void }} ctx
       */
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string' || !href) return;
        if (!isExternalHttpUrl(href, siteOrigin)) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  };
}

/**
 * @param {string} href
 * @param {string | null} siteOrigin
 */
export function isExternalHttpUrl(href, siteOrigin) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('?')) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !trimmed.startsWith('//')) {
    // Relative path without scheme (e.g. briefs/2026-11-13 or ../foo)
    return false;
  }

  let url;
  try {
    url = new URL(trimmed, siteOrigin ?? 'https://example.invalid');
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (siteOrigin && url.origin === siteOrigin) return false;
  return true;
}
