'use client';

function vibe() { try { (navigator as any)?.vibrate?.(15); } catch {} }

export default function AnchoringHub() {
  return (
    <main style={wrap}>
      <header style={hdr}>
        <a href="/hyperactivation" aria-label="Retour" style={back}>←</a>
        <h1 style={{ margin:0, fontSize:20 }}>Ancrage sensoriel</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gear}>⚙️</button>
      </header>

      <p style={{ opacity:.7, fontSize:14, margin:'8px 0 20px' }}>
        Choisis un exercice.
      </p>

      <section style={grid}>
        <a
          href="/exercice/anchoring/object"
          onMouseDown={vibe}
          style={{ ...card, background:'linear-gradient(180deg,#A78BFA22 0%,#A78BFA12 100%)' }}
          className="tile"
        >
          <div style={iconWrap}>
            <img
              src="/icons/sens.svg"
              alt="Réveiller les sens"
              width={44}
              height={44}
              style={{ display:'block', objectFit:'contain' }}
              loading="lazy"
            />
          </div>
          <div style={label}>Réveiller les sens avec un objet</div>
        </a>

        <a
          href="/exercice/anchoring/54321"
          onMouseDown={vibe}
          style={{ ...card, background:'linear-gradient(180deg,#A78BFA22 0%,#A78BFA12 100%)' }}
          className="tile"
        >
          <div style={iconWrap}>
            <img
              src="/icons/exercice.svg"
              alt="Exercice 5-4-3-2-1"
              width={44}
              height={44}
              style={{ display:'block', objectFit:'contain' }}
              loading="lazy"
            />
          </div>
          <div style={label}>Exercice 5-4-3-2-1</div>
        </a>
      </section>

      <style>{css}</style>
    </main>
  );
}

const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 20px' };
const hdr: React.CSSProperties  = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' };
const back: React.CSSProperties = { textDecoration:'none', color:'#111', fontSize:20 };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };

const grid: React.CSSProperties  = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, maxWidth:720, margin:'0 auto' };
const card: React.CSSProperties  = { display:'grid', placeItems:'center', gap:8, padding:'26px 14px', borderRadius:22, textDecoration:'none', color:'#0f172a', border:'1px solid rgba(0,0,0,.06)', boxShadow:'0 8px 18px rgba(0,0,0,.08)' };
const label: React.CSSProperties = { fontWeight:700, fontSize:15, textAlign:'center' };

const iconWrap: React.CSSProperties = {
  width: 64,
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.95)',
  marginBottom: 6,
  boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.02)'
};

const css = `
  .tile:active { transform: scale(.98); filter: brightness(.98); }
  @media (hover:hover){ .tile:hover{ transform: translateY(-2px); box-shadow:0 12px 24px rgba(0,0,0,.10)} }
`;
