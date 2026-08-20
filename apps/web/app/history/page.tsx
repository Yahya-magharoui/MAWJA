'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyHistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tolerance/historique');
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: '#475569',
      }}
    >
      Redirection vers l’historique...
    </main>
  );
}
