import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mergeVenueCleanupCandidate, previewVenueCleanup } from '@/lib/venues/cleanup';

export const maxDuration = 60;

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { serviceClient, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  try {
    const preview = await previewVenueCleanup(auth.serviceClient);
    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('[admin/venues/cleanup] preview failed:', error);
    return NextResponse.json({ error: error.message || 'Preview failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const canonicalVenueId =
      typeof body?.canonicalVenueId === 'string' ? body.canonicalVenueId.trim() : '';
    const duplicateVenueIds = Array.isArray(body?.duplicateVenueIds)
      ? body.duplicateVenueIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];

    if (!canonicalVenueId || duplicateVenueIds.length === 0) {
      return NextResponse.json(
        { error: 'canonicalVenueId and duplicateVenueIds are required' },
        { status: 400 },
      );
    }

    const result = await mergeVenueCleanupCandidate(
      auth.serviceClient,
      canonicalVenueId,
      duplicateVenueIds,
    );
    const preview = await previewVenueCleanup(auth.serviceClient);

    return NextResponse.json({
      ok: true,
      result,
      preview,
    });
  } catch (error: any) {
    console.error('[admin/venues/cleanup] merge failed:', error);
    return NextResponse.json({ error: error.message || 'Merge failed' }, { status: 500 });
  }
}
