'use client';
import { useCallback, useMemo } from 'react';
import BackLink from '../../../components/BackLink';
import { useThemeColor, withAlpha } from '../../../components/theme';

export default function SafePlaceHub() {
  const vibe = useCallback(() => {
    try { (navigator as any)?.vibrate?.(15); } catch {}
  }, []);
  const themeColor = useThemeColor();
  const cardBackground = useMemo(
    () => `linear-gradient(180deg, ${withAlpha(themeColor, 0.12)} 0%, ${withAlpha(themeColor, 0.05)} 100%)`,
    [themeColor]
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <BackLink href="/hyperactivation" style={styles.back} />
        <h1 style={styles.h1}>Sécurisation lieu sûr</h1>
        <button aria-label="Paramètres" title="Paramètres" style={styles.gear}>⚙️</button>
      </header>

      <p style={styles.subtitle}>Choisis</p>

     <section style={styles.grid}>
      <a
          href="/exercice/safe-place/build"
          onMouseDown={vibe}
          className="tile"
          style={{ ...styles.card, background: cardBackground }}
      >
       <div style={styles.icon}>
         <img
        src="/icons/safeplace.svg"
        alt="Construire mon lieu sûr"
        style={{ width: 48, height: 48, display: 'block', margin: '0 auto' }}
       />
        </div>
      <div style={styles.label}>Construire mon{"\n"}lieu sûr</div>
    </a>

      <a
        href="/exercice/safe-place/visit"
        onMouseDown={vibe}
        className="tile"
        style={{ ...styles.card, background: cardBackground }}
      >
        <div style={styles.icon}>
          <img
            src="/icons/safe.svg"
            alt="Aller dans mon lieu sûr"
            style={{ width: 48, height: 48, display: 'block', margin: '0 auto' }}
          />
        </div>
        <div style={styles.label}>Aller dans mon{"\n"}lieu sûr</div>
      </a>
    </section>

Ò
      <button
        onMouseDown={vibe}
        onClick={() => {
          const paths = ['/exercice/safe-place/build','/exercice/safe-place/visit'];
          window.location.href = paths[Math.floor(Math.random()*paths.length)];
        }}
        aria-label="Choix aléatoire"
        style={{ ...styles.fab, background: themeColor }}
      >
        Choix aléatoire
      </button>

      <style>{css}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#F6F7FE',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    padding: '16px 20px 90px',
  },
  header: { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' },
  back: { justifySelf: 'start' },
  h1: { margin:0, fontSize:20, fontWeight:800 },
  gear: { justifySelf:'end', border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' },
  subtitle: { margin:'8px 0 22px', opacity:.7, fontSize:14 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, maxWidth:520, margin:'16px auto 0' },
  card: {
    display:'grid', placeItems:'center', gap:8, padding:'22px 12px', borderRadius:22,
    textDecoration:'none', color:'#0f172a', border:'1px solid rgba(0,0,0,.06)',
    boxShadow:'0 8px 18px rgba(0,0,0,.08)',
    background:'linear-gradient(180deg, rgba(var(--theme-color-rgb),0.125) 0%, rgba(var(--theme-color-rgb),0.07) 100%)',
    transition:'transform .12s ease, box-shadow .12s ease, filter .12s ease'
  },
  cardTone: {},
  icon: { fontSize:36, lineHeight:1 },
  label: { fontWeight:700, fontSize:14, whiteSpace:'pre-line', textAlign:'center' },
  fab: {
    position:'fixed', left:'50%', transform:'translateX(-50%)',
    bottom:20, padding:'10px 16px', borderRadius:16,
    border:'1px solid rgba(0,0,0,.08)', background:'var(--theme-color)', color:'#fff',
    boxShadow:'0 10px 24px rgba(0,0,0,.15)', cursor:'pointer', fontWeight:700
  }
};

const css = `
  .tile:active { transform: scale(0.98); filter: brightness(0.98); }
  @media (hover:hover) {
    .tile:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,.10); }
  }
`;
