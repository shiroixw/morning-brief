#!/usr/bin/env node
/**
 * Fetch protected tag weights and score sample / stdin candidates.
 *
 * Env:
 *   WEIGHTS_READ_TOKEN  (required)
 *   SITE_URL            (default https://morning-brief-beta-blue.vercel.app)
 *
 * Usage:
 *   node scripts/score-candidates.mjs
 *   echo '[{"id":"a","tags":["AI","科技"]}]' | node scripts/score-candidates.mjs
 */

function scoreCandidate(candidate, weights) {
  let score = 0;
  for (const tag of candidate.tags || []) {
    score += weights[tag] ?? 0;
  }
  return score;
}

function scoreCandidates(candidates, weights) {
  return candidates
    .map((c) => ({ ...c, score: scoreCandidate(c, weights) }))
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
}

const site = (process.env.SITE_URL || 'https://morning-brief-beta-blue.vercel.app').replace(
  /\/$/,
  '',
);
const token = process.env.WEIGHTS_READ_TOKEN;

if (!token) {
  console.error('WEIGHTS_READ_TOKEN is required');
  process.exit(1);
}

const defaultCandidates = [
  { id: 'sample-ai', tags: ['AI', '科技'] },
  { id: 'sample-dev', tags: ['开发', '产品'] },
  { id: 'sample-humanities', tags: ['人文', '社会'] },
  { id: 'sample-science', tags: ['科学'] },
];

async function readCandidates() {
  if (process.stdin.isTTY) return defaultCandidates;
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return defaultCandidates;
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('stdin must be a JSON array of {id, tags}');
  return parsed;
}

const res = await fetch(`${site}/api/weights`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
if (!res.ok || !data?.ok) {
  console.error('Failed to fetch weights:', data?.error || res.status);
  process.exit(1);
}

const candidates = await readCandidates();
const ranked = scoreCandidates(candidates, data.weights || {});

console.log(JSON.stringify({ updatedAt: data.updatedAt, weights: data.weights, ranked }, null, 2));
