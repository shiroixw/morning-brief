/** Closed vocabulary for article tags. Keep small and stable. */
export const TAG_VOCABULARY = [
  'AI',
  '科技',
  '产品',
  '开发',
  '人文',
  '社会',
  '科学',
  '文化',
  '生活',
] as const;

export type Tag = (typeof TAG_VOCABULARY)[number];

const TAG_SET = new Set<string>(TAG_VOCABULARY);

export function isTag(value: string): value is Tag {
  return TAG_SET.has(value);
}

export function parseTags(raw: unknown): Tag[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0 || raw.length > 8) return null;
  const out: Tag[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !isTag(item)) return null;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

export function parseTagsCsv(csv: string): Tag[] | null {
  const parts = csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parseTags(parts);
}
