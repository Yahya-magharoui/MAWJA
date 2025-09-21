'use client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const name = params.get('name') ?? '';

  // si un "guestId" existe déjà, on peut proposer un accès direct
  useEffect(() => {
    // rien, juste un exemple si tu veux auto-redirect plus tard
  }, []);

  async function startGuest() {
    // crée un identifiant invité (local-only)
    const existing = localStorage.getItem('guestId');
    const guestId = existing ?? crypto.randomUUID();
    localStorage.setItem('guestId', guestId);

    // petite “fiche profil” locale
    const profile = { id: guestId, role: 'guest', createdAt: new Date().toISOString() };
    localStorage.setItem('guestProfile', JSON.stringify(profile));

    // redirige vers une page d’accueil interne
    router.push('/home');
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#F6F7FE',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 520, width: '100%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 8 }}>
          <a href="#" onClick={(e)=>e.preventDefault()} style={{ fontSize:12, opacity:.8 }}>FR</a>
          <a href="#" onClick={(e)=>e.preventDefault()} style={{ fontSize:12, opacity:.5 }}>EN</a>
        </div>

        <p style={{ fontSize: 20, margin: 0 }}>Bienvenue dans</p>
        <h1 style={{ fontSize: 28, margin: '6px 0 10px', letterSpacing: 1 }}>MAWJA</h1>

        <Image
          src="/LogoMawja.png"
          alt="Logo MAWJA"
          width={220}
          height={220}
          style={{ margin: '6px auto 12px', height: 'auto' }}
          priority
        />
        {name ? <p style={{ fontSize: 18, marginTop: 6 }}>Bonjour {name} !</p> : null}

        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
          <a
            href="/signup"
            style={btnStyle}
          >Créer un compte</a>

          <a
            href="/login"
            style={{ ...btnStyle, background: '#fff' }}
          >Se connecter</a>

          <button
            onClick={startGuest}
            style={{ ...btnStyle, background: 'transparent', border: '1px dashed #bbb' }}
          >
            Continuer sans compte
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: '#555' }}>
          <a href="/emergency" style={{ color: '#b91c1c', marginRight: 12 }}>Numéros d’urgence</a>
          <a href="/privacy" style={{ marginRight: 12 }}>Confidentialité</a>
          <a href="/terms">CGU</a>
        </div>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #ddd',
  background: '#fafafa',
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#111',
  display: 'inline-block',
};
