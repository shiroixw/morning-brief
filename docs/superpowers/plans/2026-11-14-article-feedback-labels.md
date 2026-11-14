# Article feedback labels — Implementation Plan

> **For agentic workers:** Keep API/Blob/weights unchanged. Brief pages only. Preview PR; do not merge.

**Goal:** On `/briefs/YYYY-MM-DD/` article items, rename visible feedback buttons from 「喜欢 / 不喜欢」 to 「点赞 / 点踩」. No gestures. No hand-shaped icon buttons.

## File map

| File | Responsibility |
|------|----------------|
| `src/scripts/article-feedback.ts` | Export + use `点赞` / `点踩` button labels |
| `src/scripts/article-feedback.test.ts` | Lock the visible labels |

## Unchanged

- `POST /api/feedback`, `GET /api/weights`, Blob document, weight math
- `mb-feedback:{articleId}`, optimistic updates, vote / undo / switch
- Markdown content, hidden markers, external-link behavior, home page

## Verification

`npm test`, `npm run build` (Node 22.23.4). Built brief HTML shows 「点赞」「点踩」, not 「喜欢」「不喜欢」; hidden `data-article-id` markers remain; feedback script present.
