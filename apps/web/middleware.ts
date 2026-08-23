import { NextRequest, NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

function getApiOrigin() {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawApiUrl) return null;

  try {
    return new URL(rawApiUrl).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy(nonce: string) {
  const apiOrigin = getApiOrigin();
  const connectSources = [
    "'self'",
    apiOrigin,
    isDevelopment ? 'ws:' : null,
    isDevelopment ? 'wss:' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isDevelopment ? "'unsafe-eval'" : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    `connect-src ${connectSources}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    !isDevelopment ? 'upgrade-insecure-requests' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
