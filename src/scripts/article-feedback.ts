type Vote = 'like' | 'dislike';

const STORAGE_PREFIX = 'mb-feedback:';

function storageKey(articleId: string): string {
  return `${STORAGE_PREFIX}${articleId}`;
}

function readStoredVote(articleId: string): Vote | null {
  try {
    const raw = localStorage.getItem(storageKey(articleId));
    if (raw === 'like' || raw === 'dislike') return raw;
    return null;
  } catch {
    return null;
  }
}

function writeStoredVote(articleId: string, vote: Vote | null): void {
  try {
    if (!vote) localStorage.removeItem(storageKey(articleId));
    else localStorage.setItem(storageKey(articleId), vote);
  } catch {
    /* private mode */
  }
}

function createButton(label: string, vote: Vote): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'article-feedback__btn';
  btn.dataset.vote = vote;
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = label;
  return btn;
}

async function postFeedback(payload: {
  articleId: string;
  tags: string[];
  vote: Vote | null;
  previousVote: Vote | null;
}): Promise<{ ok: boolean; localOnly?: boolean }> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { localOnly?: boolean } | null;
      return { ok: false, localOnly: Boolean(data?.localOnly) };
    }
    return { ok: true };
  } catch {
    return { ok: false, localOnly: true };
  }
}

function resolveArticleHost(el: HTMLElement): {
  host: HTMLElement;
  articleId: string;
  tagsCsv: string;
} | null {
  const marker =
    el.matches('[data-article-id][data-tags]') && el.tagName !== 'LI'
      ? el
      : el.querySelector<HTMLElement>('[data-article-id][data-tags]');

  const articleId = el.dataset.articleId || marker?.dataset.articleId;
  const tagsCsv = el.dataset.tags || marker?.dataset.tags;
  if (!articleId || !tagsCsv) return null;

  const host = el.tagName === 'LI' ? el : (el.closest('li') ?? el);
  return { host, articleId, tagsCsv };
}

function mountControls(el: HTMLElement): void {
  const resolved = resolveArticleHost(el);
  if (!resolved) return;
  const { host, articleId, tagsCsv } = resolved;
  if (host.querySelector('.article-feedback')) return;

  const tags = tagsCsv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const root = document.createElement('div');
  root.className = 'article-feedback';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', '文章反馈');

  const likeBtn = createButton('喜欢', 'like');
  const sep = document.createElement('span');
  sep.className = 'article-feedback__sep';
  sep.setAttribute('aria-hidden', 'true');
  sep.textContent = '·';
  const dislikeBtn = createButton('不喜欢', 'dislike');
  const status = document.createElement('span');
  status.className = 'article-feedback__status';
  status.setAttribute('aria-live', 'polite');

  root.append(likeBtn, sep, dislikeBtn, status);
  host.append(root);

  let current: Vote | null = readStoredVote(articleId);
  let pending = false;

  const syncUi = () => {
    likeBtn.setAttribute('aria-pressed', current === 'like' ? 'true' : 'false');
    dislikeBtn.setAttribute('aria-pressed', current === 'dislike' ? 'true' : 'false');
    likeBtn.classList.toggle('is-active', current === 'like');
    dislikeBtn.classList.toggle('is-active', current === 'dislike');
  };

  syncUi();

  const onClick = async (next: Vote) => {
    if (pending) return;
    const previousVote = current;
    const vote: Vote | null = previousVote === next ? null : next;

    // Optimistic UI + local persistence
    current = vote;
    writeStoredVote(articleId, vote);
    syncUi();
    status.textContent = '';

    pending = true;
    root.classList.add('is-pending');
    const result = await postFeedback({
      articleId,
      tags,
      vote,
      previousVote,
    });
    pending = false;
    root.classList.remove('is-pending');

    if (!result.ok) {
      // Keep local choice; note storage quietly
      status.textContent = result.localOnly ? '已记在本地' : '同步未成功';
    }
  };

  likeBtn.addEventListener('click', () => void onClick('like'));
  dislikeBtn.addEventListener('click', () => void onClick('dislike'));
}

export function initArticleFeedback(root: ParentNode = document): void {
  const items = root.querySelectorAll<HTMLElement>(
    'li[data-article-id][data-tags], .prose-brief li [data-article-id][data-tags]',
  );
  items.forEach((el) => mountControls(el));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initArticleFeedback(), { once: true });
  } else {
    initArticleFeedback();
  }
}
