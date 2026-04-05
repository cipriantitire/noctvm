import { NextRequest, NextResponse } from 'next/server';

function getOembedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'youtu.be') {
      return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
    if (host === 'music.youtube.com') {
      const vid = parsed.searchParams.get('v');
      if (!vid) return null;
      return `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${vid}`)}&format=json`;
    }
    if (host === 'soundcloud.com') {
      return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
    if (host === 'open.spotify.com') {
      return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  const oembedUrl = getOembedUrl(url);
  if (!oembedUrl) return NextResponse.json({ error: 'unsupported host' }, { status: 400 });

  try {
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'oembed failed' }, { status: 502 });
    const data = await res.json() as { title?: string; author_name?: string };
    return NextResponse.json({ title: data.title ?? data.author_name ?? null });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
