export const prerender = false;

import type { APIRoute } from 'astro';
import { getBlobAvailability, readWeightDocument } from '../../lib/feedback-store';
import { timingSafeEqualString } from '../../lib/request-guard';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

function extractBearer(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

export const GET: APIRoute = async ({ request }) => {
  const expected = process.env.WEIGHTS_READ_TOKEN;
  if (!expected) {
    return json({ ok: false, error: 'WEIGHTS_READ_TOKEN is not configured' }, 503);
  }

  const token = extractBearer(request);
  if (!token || !timingSafeEqualString(token, expected)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  const availability = getBlobAvailability();
  if (!availability.ok) {
    return json({ ok: false, error: availability.reason }, 503);
  }

  try {
    const { doc } = await readWeightDocument();
    return json({
      ok: true,
      version: doc.version,
      updatedAt: doc.updatedAt,
      weights: doc.weights,
      eventCount: doc.events.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error';
    console.error('[weights]', message);
    return json({ ok: false, error: 'Failed to read weights' }, 503);
  }
};
