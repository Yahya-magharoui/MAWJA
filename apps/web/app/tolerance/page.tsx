'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AuthRequiredNotice from '../../components/AuthRequiredNotice';
import BackLink from '../../components/BackLink';
import { useThemeColor, withAlpha } from '../../components/theme';
import { useSessionInfo } from '../../lib/session';

export default function ToleranceHome() {
  const router = useRouter();
  const theme = useThemeColor();
  const session = useSessionInfo();
  const isAuthenticatedPatient = session?.status === 'registered' && session.role === 'PATIENT';
  const isGuestPatient = session?.status === 'guest';

  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${withAlpha(theme, 0.13)} 0%, #F6F7FE 55%)`,
    [theme]
  );
  const tileStyle = useMemo(() => tile(theme), [theme]);
  const lockedTileStyle = useMemo(() => lockedTile(theme), [theme]);

  return (
    <main style={{ ...wrap, background: bg }}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Fenêtre de tolérance</h1>
        <div />
      </header>

      <p style={{ margin:'6px 20px 14px', opacity:.7, maxWidth:720 }}>
        Choisis ce que tu veux faire.
      </p>

      <section style={grid}>
        <a href="/exercice/emotions" className="tile" style={tileStyle}>
         <img
            src="/icons/emotion.svg"
            alt="Roue des émotions"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Roue des émotions</span>
        </a>
        {isAuthenticatedPatient ? (
        <a href="/tolerance/objectifs" className="tile" style={tileStyle}>
         <img
            src="/icons/objectif.svg"
            alt="Mes objectifs"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Mes objectifs</span>
        </a>
        ) : (
        <div style={lockedTileStyle}>
          <img
            src="/icons/objectif.svg"
            alt="Mes objectifs"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px', opacity: 0.55 }}
          />
          <span>Mes objectifs</span>
          <small style={lockedText}>Connexion requise</small>
        </div>
        )}
        {isAuthenticatedPatient ? (
        <a href="/tolerance/notes" className="tile" style={tileStyle}>
         <img
            src="/icons/notes.svg"
            alt="Mes notes"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Mes notes</span>
        </a>
        ) : (
        <div style={lockedTileStyle}>
          <img
            src="/icons/notes.svg"
            alt="Mes notes"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px', opacity: 0.55 }}
          />
          <span>Mes notes</span>
          <small style={lockedText}>Connexion requise</small>
        </div>
        )}
        {isAuthenticatedPatient ? (
        <a href="/tolerance/routine" className="tile" style={tileStyle}>
         <img
            src="/icons/routine.svg"
            alt="Ma routine"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Ma routine</span>
        </a>
        ) : (
        <div style={lockedTileStyle}>
          <img
            src="/icons/routine.svg"
            alt="Ma routine"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px', opacity: 0.55 }}
          />
          <span>Ma routine</span>
          <small style={lockedText}>Connexion requise</small>
        </div>
        )}
        {isAuthenticatedPatient ? (
        <a href="/tolerance/historique" className="tile" style={tileStyle}>
         <img
            src="/icons/historique.svg"
            alt="Historique"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Historique</span>
        </a>
        ) : (
        <div style={lockedTileStyle}>
          <img
            src="/icons/historique.svg"
            alt="Historique"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px', opacity: 0.55 }}
          />
          <span>Historique</span>
          <small style={lockedText}>Connexion requise</small>
        </div>
        )}
      </section>

      {isGuestPatient ? <AuthRequiredNotice subject="tes objectifs, notes, routine et historique" /> : null}

      <style>{css}</style>
    </main>
  );
}

const wrap: React.CSSProperties = { minHeight:'100dvh', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' };
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' };
const backBtn: React.CSSProperties = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' };

const grid: React.CSSProperties = {
  display:'grid', gap:16,
  gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))',
  padding:'0 20px', maxWidth:900, margin:'0 auto'
};
const tile = (color: string): React.CSSProperties => ({
  display:'grid', placeItems:'center', gap:8,
  textDecoration:'none', color:'#0f172a', fontWeight:700,
  borderRadius:18, padding:'26px 12px',
  background:`linear-gradient(180deg, ${withAlpha(color, 0.16)} 0%, ${withAlpha(color, 0.07)} 100%)`,
  boxShadow:`0 8px 18px ${withAlpha(color, 0.25)}`
});
const lockedTile = (color: string): React.CSSProperties => ({
  ...tile(color),
  opacity: 0.68,
  filter: 'grayscale(.18)',
  cursor: 'not-allowed',
});
const lockedText: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  fontWeight: 600,
};
const css = `.tile span{display:block;font-size:14px}`;
