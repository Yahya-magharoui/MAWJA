'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Guest = { id: string; role: 'guest'; createdAt: string };

export default function HomeApp() {
  const [guest, setGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('guestProfile');
    if (raw) setGuest(JSON.parse(raw));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Accueil</h1>
      {guest ? (
        <p>Mode invité activé (id: {guest.id.slice(0, 8)}…)</p>
      ) : (
        <p>Connecté (à venir quand l’auth sera branchée)</p>
      )}

      <ul style={{ lineHeight: 1.9 }}>
        <li><Link href="/">⟵ Retour</Link></li>
        <li><Link href="/history">Historique</Link></li>
        <li><Link href="/health">Vérifier l’API</Link></li>
      </ul>
    </main>
  );
}
