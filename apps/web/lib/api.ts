function normalizeApiBaseUrl(rawUrl?: string | null) {
  const value = rawUrl?.trim();
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000/api';
    }

    throw new Error(
      'NEXT_PUBLIC_API_URL is required in non-development environments.'
    );
  }

  const normalized = value.replace(/\/+$/, '');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be a valid absolute URL.');
  }

  const isLocalHost =
    parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';

  if (
    process.env.NODE_ENV !== 'development' &&
    parsedUrl.protocol !== 'https:' &&
    !isLocalHost
  ) {
    throw new Error(
      'NEXT_PUBLIC_API_URL must use HTTPS in non-development environments.'
    );
  }

  return normalized;
}

export const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export function buildApiUrl(path: string) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
