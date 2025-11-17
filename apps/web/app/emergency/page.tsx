'use client';

import { useCallback } from 'react';

export default function EmergencyPage() {
  const vibe = useCallback(() => {
    try { (navigator as any)?.vibrate?.(15); } catch {}
  }, []);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <a href="/hyperactivation" aria-label="Retour" style={styles.back}>←</a>
        <h1 style={styles.h1}>J’ai besoin d’aide</h1>
        <button aria-label="Paramètres" title="Paramètres" style={styles.gear}>⚙️</button>
      </header>

      <p style={styles.subtitle}>On va traverser cela ensemble</p>

      <section style={styles.grid}>
        <a
          href="/sos"
          onMouseDown={vibe}
          style={{ ...styles.card, ...styles.cardTone }}
          className="card"
        >
          <div style={styles.iconWrap}>
            <img
              src="/icons/numero.svg"
              alt="Numéros d’urgence"
              width={44}
              height={44}
              style={{ display:'block', objectFit:'contain' }}
              loading="lazy"
            />
          </div>
          <div style={styles.label}>Numéros d’urgence</div>
        </a>

        <a
          href="/plan"
          onMouseDown={vibe}
          style={{ ...styles.card, ...styles.cardTone }}
          className="card"
        >
          <div style={styles.iconWrap}>
            <img
              src="/icons/plan.svg"
              alt="Mon plan de crise"
              width={44}
              height={44}
              style={{ display:'block', objectFit:'contain' }}
              loading="lazy"
            />
          </div>
          <div style={styles.label}>Mon plan de crise</div>
        </a>
      </section>

      <style>{css}</style>
    </main>
  );
}

/* styles inline pour rester cohérent avec tes autres pages */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#F6F7FE',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    padding: '16px 20px 28px',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
  },
  back: { textDecoration: 'none', color: '#111', fontSize: 20 },
  h1: { margin: 0, fontSize: 22, fontWeight: 800, textAlign: 'center' },
  gear: {
    justifySelf: 'end',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 12,
    padding: '8px 10px',
    cursor: 'pointer',
  },
  subtitle: {
    margin: '8px 0 22px',
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 18,
    maxWidth: 520,
    margin: '16px auto 0',
  },
  card: {
    display: 'grid',
    placeItems: 'center',
    gap: 8,
    padding: '26px 12px',
    borderRadius: 22,
    textDecoration: 'none',
    color: '#0f172a',
    border: '1px solid rgba(0,0,0,.06)',
    boxShadow: '0 8px 18px rgba(0,0,0,.08)',
    background: 'linear-gradient(180deg, #A78BFA20 0%, #A78BFA12 100%)',
    transition: 'transform .12s ease, box-shadow .12s ease, filter .12s ease',
  },
  cardTone: {},
  // wrapper centré pour l'icône (taille, background léger)
  iconWrap: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.95)',
    marginBottom: 6,
    boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.02)',
  },
  label: { fontWeight: 700, fontSize: 15, textAlign: 'center' },
};

const css = `
  .card:active { transform: scale(0.98); filter: brightness(0.98); }
  @media (hover:hover) {
    .card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,.10); }
  }
`;
