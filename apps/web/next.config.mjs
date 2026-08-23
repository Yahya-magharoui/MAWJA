/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

function getApiOrigin() {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawApiUrl) return null;

  try {
    return new URL(rawApiUrl).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const apiOrigin = getApiOrigin();
  const connectSources = ["'self'", apiOrigin, !isProduction ? 'ws:' : null, !isProduction ? 'wss:' : null]
    .filter(Boolean)
    .join(' ');
  const scriptSources = ["'self'", "'unsafe-inline'", !isProduction ? "'unsafe-eval'" : null]
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
    isProduction ? 'upgrade-insecure-requests' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

const nextConfig = {
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async headers() {
    const baseHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
    ];

    if (isProduction) {
      baseHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/:path*',
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
