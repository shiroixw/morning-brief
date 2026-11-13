# Article feedback + tag-weight recommendations — Implementation Plan

> **For agentic workers:** Implement TDD for pure weight/scoring modules first, then API/UI. Preview PR only; do not merge. Do not change weekday auto-publish.

**Goal:** Per-article like/dislike on briefs, private Blob event log + tag weights, protected weights read API, scoring helper for future brief generation.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/tags.ts` | Tag vocabulary + validation |
| `src/lib/weights.ts` | Pure applyVote / scoreCandidates |
| `src/lib/feedback-store.ts` | Lazy Blob read/write (private JSON) |
| `src/lib/request-guard.ts` | Origin/Host checks |
| `src/pages/api/feedback.ts` | POST feedback |
| `src/pages/api/weights.ts` | GET weights (Bearer) |
| `src/markdown/article-meta.mjs` | Optional comment → `li` data attrs |
| Brief markers | Hidden `span[data-article-id][data-tags]` in each article `li` |
| `src/scripts/article-feedback.ts` | Client UI + localStorage + POST |
| `content/briefs/*.md` | Article id/tag comments only |
| `docs/recommendation-weights.md` | Operator docs |
| `scripts/score-candidates.mjs` | Optional CLI |
| `astro.config.mjs` | `@astrojs/vercel` + article-meta plugin |

## Formula

- Like: each tag `+1`. Dislike: each tag `-1`. Undo/switch: reverse previous then apply new.
- Score(item) = sum of its tag weights (missing → 0). Tilt only; never a hard filter.

## Verification

`npm test`, `npm run build`, brief page DOM check + screenshots.
