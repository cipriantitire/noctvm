// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cron/fetch-events
//
// Called by Vercel Cron every 2 hours (see vercel.json).
// Protected by CRON_SECRET env var so only Vercel (or manual admin triggers)
// can call it.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { fetchAndUpsertEvents } from '@/lib/scrapers/index';

export const maxDuration = 60; // seconds (Vercel Pro required for >10s)
export const dynamic    = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Run scrapers ──────────────────────────────────────────────────────────
  try {
    const body = await req.json().catch(() => ({}));
    const sourceFromQuery = req.nextUrl.searchParams.get('source') || undefined;
    const sourceFromBody = typeof body?.source === 'string' ? body.source : undefined;
    const targetSource = sourceFromQuery || sourceFromBody;

    const summary = await fetchAndUpsertEvents(targetSource);

    console.log('[cron/fetch-events] done:', JSON.stringify(summary));

    return NextResponse.json({
      ok: true,
      source: targetSource ?? 'all',
      ...summary,
    });
  } catch (err) {
    console.error('[cron/fetch-events] fatal error:', err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

// Allow Vercel Cron to call with GET as well (older cron versions use GET)
export async function GET(req: NextRequest) {
  return POST(req);
}
