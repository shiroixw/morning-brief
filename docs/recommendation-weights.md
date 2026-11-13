# Recommendation weights

Private tag-weight signal for future brief generation. **Public pages never show this table** and never imply personal targeting.

## Storage

- Private Vercel Blob store (`access: 'private'`).
- Single JSON document: `feedback/weights.json` (event log + aggregated tag weights).
- Prefer OIDC + `BLOB_STORE_ID` on Vercel; `BLOB_READ_WRITE_TOKEN` works as fallback.
- `WEIGHTS_READ_TOKEN` protects `GET /api/weights`.

## Tag vocabulary

Stable closed set (refine only deliberately):

`AI` · `科技` · `产品` · `开发` · `人文` · `社会` · `科学` · `文化` · `生活`

## Tagging future articles

In brief Markdown, append a hidden marker span as the last line of each article list item:

```markdown
- **[Title](https://example.com)**：摘要……
  <span hidden data-article-id="2026-11-14-example-slug" data-tags="AI,科技"></span>
```

(A matching HTML comment form is also recognized by the markdown plugin when present.)

Rules:

- `id`: lowercase kebab-case, ideally `YYYY-MM-DD-short-slug`, stable forever.
- `tags`: comma-separated from the vocabulary above (1–8 unique tags).
- Do not rewrite prose except to attach the marker.
- Include 值得慢读 items too.

## Formula

- Like → each of the article’s tags `+1`
- Dislike → each tag `-1`
- Undo / switch → reverse the previous vote, then apply the new one
- Candidate score = sum of its tag weights (missing tag → `0`)

Weights are a **tilt**, not a hard filter:

- Keep tech / AI coverage important even if other tags trend up.
- One dislike must not ban a tag.
- Do not change weekday auto-publish authorization or routine behavior.

## Fetching weights (brief generation)

```bash
curl -sS \
  -H "Authorization: Bearer $WEIGHTS_READ_TOKEN" \
  "https://morning-brief-beta-blue.vercel.app/api/weights"
```

Response shape:

```json
{
  "ok": true,
  "version": 1,
  "updatedAt": "…",
  "weights": { "AI": 2, "人文": -1 },
  "eventCount": 12
}
```

Score candidates with the pure helper:

```ts
import { scoreCandidates } from '../src/lib/weights';

const ranked = scoreCandidates(candidates, weights);
```

Or print scores when env is present:

```bash
WEIGHTS_READ_TOKEN=… SITE_URL=https://morning-brief-beta-blue.vercel.app \
  node scripts/score-candidates.mjs
```

## Blob setup (if not already attached)

1. Create a **private** Blob store in the Vercel dashboard (or CLI).
2. Attach it to project `prj_d5i4DyBgdhJhmwcdujbzQBRDpisK` (team `team_jhxUpI5P62jYxNgIZ8QZK98O`).
3. Set for Production and Preview (and Development if useful):
   - `BLOB_STORE_ID` (preferred with OIDC)
   - and/or `BLOB_READ_WRITE_TOKEN`
   - `WEIGHTS_READ_TOKEN` (random secret for the protected GET)

If Blob env is missing, `POST /api/feedback` returns `503` with `localOnly: true`; the UI keeps the visitor’s choice in `localStorage` and does not explode.
