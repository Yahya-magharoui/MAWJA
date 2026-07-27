const DEFAULT_API_URL = 'https://mawja-back.onrender.com/api';

function normalizeApiBaseUrl(rawUrl?: string | null) {
  const value = rawUrl?.trim();
  if (!value) return DEFAULT_API_URL;
  return value.replace(/\/+$/, '');
}

export const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export function buildApiUrl(path: string) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
