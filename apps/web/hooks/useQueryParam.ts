'use client';

import { useEffect, useState } from 'react';

export function useQueryParam(key: string, fallback: string | null = null) {
  const [value, setValue] = useState<string | null>(() => {
    if (typeof window === 'undefined') return fallback;
    try {
      return new URLSearchParams(window.location.search).get(key) ?? fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const next = new URLSearchParams(window.location.search).get(key);
      setValue(next ?? fallback);
    } catch {
      setValue(fallback);
    }
  }, [key, fallback]);

  return value;
}
