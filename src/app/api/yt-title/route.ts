import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  try {
    // Normalise: convert music.youtube.com → www.youtube.com
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let oembedUrl: string;

    if (host === 'music.youtube.com') {
      const vid = parsed.searchParams.get('v');
      if (!vid) return NextResponse.json({ error: 'no video id' }, { status: 400 });
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${vid}`)}&format=json`;
    } else if (host === 'youtube.com' || host === 'youtu.be') {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else {
      return NextResponse.json({ error: 'unsupported host' }, { status: 400 });
    }

    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'oembed failed' }, { status: 502 });
    const data = await res.json() as { title?: string; author_name?: string };
    return NextResponse.json({ title: data.title ?? data.author_name ?? null });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
