// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cron/fetch-events
//
// Called by Vercel Cron daily (see vercel.json).
// Protected by CRON_SECRET env var so only Vercel (or manual admin triggers)
// can call it.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { fetchAndUpsertEvents } from '@/lib/scrapers/index';
import { sendAlertEmail } from '@/lib/alerts/email';

// Full multi-source scrapes can exceed 60s on production.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret) {
    const authHeader = req.headers.get('authorization')?.trim() || '';
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = bearerMatch?.[1]?.trim() || '';

    if (!token || token !== secret) {
      console.warn('[cron/fetch-events] unauthorized request blocked');
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
    const failedSources = summary.results.filter((result) => !!result.error);

    if (failedSources.length > 0) {
      const subject = `[NOCTVM] Scraper partial failure (${failedSources.length} source${failedSources.length === 1 ? '' : 's'})`;
      const text = [
        'One or more scrapers failed during the latest cron run.',
        '',
        `Source target: ${targetSource ?? 'all'}`,
        `Timestamp (UTC): ${new Date().toISOString()}`,
        `Total deduped events: ${summary.total}`,
        `Total upserted events: ${summary.upserted}`,
        '',
        'Failed sources:',
        ...failedSources.map((result) => `- ${result.source}: ${result.error}`),
      ].join('\n');

      const alertResult = await sendAlertEmail({ subject, text });
      if (!alertResult.sent) {
        const reason = alertResult.error || alertResult.reason || 'unknown';
        console.warn('[cron/fetch-events] failed-source alert email not sent:', reason);
      }
    }

    console.log('[cron/fetch-events] done:', JSON.stringify(summary));

    return NextResponse.json({
      ok: true,
      source: targetSource ?? 'all',
      ...summary,
    });
  } catch (err) {
    console.error('[cron/fetch-events] fatal error:', err);

    const errorText = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const subject = '[NOCTVM] Scraper cron fatal error';
    const text = [
      'The /api/cron/fetch-events endpoint crashed before returning a successful response.',
      '',
      `Timestamp (UTC): ${new Date().toISOString()}`,
      `Error: ${errorText}`,
    ].join('\n');

    const alertResult = await sendAlertEmail({ subject, text });
    if (!alertResult.sent) {
      const reason = alertResult.error || alertResult.reason || 'unknown';
      console.warn('[cron/fetch-events] fatal-error alert email not sent:', reason);
    }

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
