export const prerender = false;

import type { APIRoute } from 'astro';
import { parseFeedbackBody } from '../../lib/feedback-input';
import { getBlobAvailability, recordFeedback } from '../../lib/feedback-store';
import { isAllowedOrigin } from '../../lib/request-guard';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request, site }) => {
  if (!isAllowedOrigin(request, site?.href ?? import.meta.env.SITE)) {
    return json({ ok: false, error: 'Forbidden origin' }, 403);
  }

  const availability = getBlobAvailability();
  if (!availability.ok) {
    return json(
      {
        ok: false,
        localOnly: true,
        error: availability.reason,
      },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const parsed = parseFeedbackBody(raw);
  if (!parsed.ok) {
    return json({ ok: false, error: parsed.error }, 400);
  }

  try {
    const doc = await recordFeedback(parsed.value);
    return json({
      ok: true,
      updatedAt: doc.updatedAt,
      // Never return full weight table to the public POST client
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error';
    console.error('[feedback]', message);
    return json({ ok: false, localOnly: true, error: 'Failed to persist feedback' }, 503);
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
