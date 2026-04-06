import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const STORY_BUCKET = 'story-media';
const STORY_ALLOWED_MIME_TYPES = ['image/*', 'video/*'];

function readTextField(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function readTagsField(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const tags = parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    return tags.length > 0 ? tags : null;
  } catch {
    return null;
  }
}

async function ensureStoryBucketExists() {
  const supabase = createServerClient();
  const { data: bucket, error } = await supabase.storage.getBucket(STORY_BUCKET);

  if (error || !bucket) {
    const { error: createError } = await supabase.storage.createBucket(STORY_BUCKET, {
      public: true,
      allowedMimeTypes: STORY_ALLOWED_MIME_TYPES,
    });

    if (createError) throw createError;
    return;
  }

  const allowedMimeTypes = bucket.allowed_mime_types ?? [];
  const needsUpdate =
    !bucket.public ||
    allowedMimeTypes.length !== STORY_ALLOWED_MIME_TYPES.length ||
    STORY_ALLOWED_MIME_TYPES.some((mimeType) => !allowedMimeTypes.includes(mimeType));

  if (needsUpdate) {
    const { error: updateError } = await supabase.storage.updateBucket(STORY_BUCKET, {
      public: true,
      allowedMimeTypes: STORY_ALLOWED_MIME_TYPES,
    });

    if (updateError) throw updateError;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice('Bearer '.length);
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabase = createServerClient();

  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid story payload' }, { status: 400 });
  }

  const media = formData.get('media');
  if (!(media instanceof File)) {
    return NextResponse.json({ error: 'Add a photo or video for your story.' }, { status: 400 });
  }

  const caption = readTextField(formData.get('caption'));
  const venueName = readTextField(formData.get('venue_name'));
  const expiresAt = readTextField(formData.get('expires_at'));
  const eventId = readTextField(formData.get('event_id')) || null;
  const eventTitle = readTextField(formData.get('event_title')) || null;
  const tags = readTagsField(formData.get('tags'));

  try {
    await ensureStoryBucketExists();

    const extension = media.name.includes('.')
      ? media.name.split('.').pop() || 'jpg'
      : (media.type.startsWith('video/') ? 'mp4' : 'jpg');
    const path = `${user.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORY_BUCKET)
      .upload(path, media, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(STORY_BUCKET).getPublicUrl(path);

    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
        venue_name: venueName || null,
        expires_at: expiresAt || null,
        tags,
        event_id: eventId,
        event_title: eventTitle,
      })
      .select('id, user_id, image_url, caption, venue_name, expires_at, tags, event_id, event_title, created_at')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, story });
  } catch (error) {
    console.error('[api/stories] failed to create story:', error);

    const message = error instanceof Error ? error.message : 'Failed to share story.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}