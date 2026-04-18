import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sendAlertEmail } from '@/lib/alerts/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ScraperLogResult {
  source?: string;
  count?: number;
  error?: string;
}

interface ScraperLogRow {
  source?: string | null;
  run_date?: string | null;
  total_upserted?: number | null;
  results?: ScraperLogResult[] | null;
}

function getBearerToken(req: NextRequest): string {
  const authHeader = req.headers.get('authorization')?.trim() || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1]?.trim() || '';
}

function getStaleThresholdHours(): number {
  const raw = (process.env.SCRAPER_ALERT_MAX_STALENESS_HOURS || '').trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return parsed;
}

function computeAgeHours(runDateIso?: string | null): number | null {
  if (!runDateIso) return null;
  const runTime = new Date(runDateIso).getTime();
  if (Number.isNaN(runTime)) return null;
  return (Date.now() - runTime) / (1000 * 60 * 60);
}

function formatHours(value: number | null): string {
  if (value === null) return 'unknown';
  return value.toFixed(1);
}

export async function POST(req: NextRequest) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret) {
    const token = getBearerToken(req);
    if (!token || token !== secret) {
      console.warn('[cron/scraper-health] unauthorized request blocked');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const thresholdHours = getStaleThresholdHours();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('scraper_logs')
    .select('source, run_date, total_upserted, results')
    .eq('source', 'all')
    .order('run_date', { ascending: false })
    .limit(1)
    .maybeSingle<ScraperLogRow>();

  if (error) {
    console.error('[cron/scraper-health] failed to query scraper_logs:', error.message);

    const alertResult = await sendAlertEmail({
      subject: '[NOCTVM] Scraper health check failed (DB query error)',
      text: [
        'The scraper health cron could not read scraper_logs.',
        '',
        `Timestamp (UTC): ${new Date().toISOString()}`,
        `Error: ${error.message}`,
      ].join('\n'),
    });

    return NextResponse.json({
      ok: false,
      healthy: false,
      reason: 'query_failed',
      alert_sent: alertResult.sent,
      alert_skipped: alertResult.skipped,
      alert_error: alertResult.error || alertResult.reason || null,
    });
  }

  const latestRun = data || null;
  const ageHours = computeAgeHours(latestRun?.run_date);
  const isStale = ageHours === null || ageHours > thresholdHours;
  const failedSources =
    latestRun?.results?.filter((result) => typeof result.error === 'string' && result.error.trim().length > 0) || [];

  const hasSourceFailures = failedSources.length > 0;
  const healthy = !!latestRun && !isStale && !hasSourceFailures;

  if (!healthy) {
    const reasons: string[] = [];
    if (!latestRun) reasons.push('no_all_source_run');
    if (isStale) reasons.push('run_stale');
    if (hasSourceFailures) reasons.push('source_failures');

    const subject = `[NOCTVM] Scraper health alert: ${reasons.join(', ')}`;
    const textLines = [
      'The scraper health cron detected an issue.',
      '',
      `Timestamp (UTC): ${new Date().toISOString()}`,
      `Reason(s): ${reasons.join(', ')}`,
      `Latest all-source run date (UTC): ${latestRun?.run_date || 'missing'}`,
      `Run age (hours): ${formatHours(ageHours)}`,
      `Stale threshold (hours): ${thresholdHours}`,
      `Latest total_upserted: ${latestRun?.total_upserted ?? 'unknown'}`,
    ];

    if (hasSourceFailures) {
      textLines.push('');
      textLines.push('Failed sources from latest run:');
      for (const failed of failedSources) {
        textLines.push(`- ${failed.source || 'unknown'}: ${failed.error}`);
      }
    }

    const alertResult = await sendAlertEmail({
      subject,
      text: textLines.join('\n'),
    });

    return NextResponse.json({
      ok: true,
      healthy: false,
      reasons,
      latest_run_date: latestRun?.run_date || null,
      age_hours: ageHours,
      stale_threshold_hours: thresholdHours,
      failed_sources: failedSources.map((failed) => ({
        source: failed.source || 'unknown',
        error: failed.error || '',
      })),
      alert_sent: alertResult.sent,
      alert_skipped: alertResult.skipped,
      alert_error: alertResult.error || alertResult.reason || null,
    });
  }

  return NextResponse.json({
    ok: true,
    healthy: true,
    latest_run_date: latestRun.run_date || null,
    age_hours: ageHours,
    stale_threshold_hours: thresholdHours,
    failed_sources: [],
    alert_sent: false,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
