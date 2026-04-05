import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'noctvm.app';
const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  if (LOCALHOSTS.has(hostname) || hostname === CANONICAL_HOST) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = 'https:';
  redirectUrl.host = CANONICAL_HOST;

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)'],
};