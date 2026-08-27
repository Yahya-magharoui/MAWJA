import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy', '/terms'],
      disallow: [
        '/app',
        '/exercice',
        '/exercice/',
        '/tolerance',
        '/tolerance/',
        '/hyperactivation',
        '/hypoactivation',
        '/history',
        '/plan',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/health',
      ],
    },
    sitemap: 'https://kalymap.com/sitemap.xml',
    host: 'https://kalymap.com',
  };
}
