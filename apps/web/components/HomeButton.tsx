'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeButton({ style }: { style?: CSSProperties }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Accueil"
      title="Accueil"
      onClick={() => router.push('/app')}
      style={{ ...buttonStyle, ...style }}
    >
      🏠
    </button>
  );
}

const buttonStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
  lineHeight: 1,
  minWidth: 40,
  minHeight: 40,
};
