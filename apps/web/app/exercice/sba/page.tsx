'use client';

import BackLink from '../../../components/BackLink';

type Card = { label: string; href: string; icon: string };

const CARDS: Card[] = [
  { label: 'SBA Auditives', href: '/exercice/sba/auditives', icon: '/icons/auditive.svg' },
  { label: 'SBA Visuelles', href: '/exercice/sba/visuelles', icon: '/icons/sba.svg' },
  { label: 'SBA Tactiles',  href: '/exercice/sba/tactiles',  icon: '/icons/tactile.svg' },
];

export default function SBAHome() {
  const vibe = () => { try { (navigator as any)?.vibrate?.(15); } catch {} };

  return (
    <main style={page}>
      <header style={hdr}>
        <BackLink href="/hyperactivation" style={back} />
        <h1 style={{ margin:0, fontSize:20, textAlign:'center' }}>
          Stimulation Bilatérale Alternée
        </h1>
        <button style={gear} aria-label="Paramètres">⚙️</button>
      </header>

      <p style={{ opacity:.7, fontSize:14, margin:'8px 0 18px', textAlign:'center' }}>
        Choisis un type de SBA qui te convient
      </p>

      <section style={grid}>
        {CARDS.map(c => (
          <a
            key={c.href}
            href={c.href}
            onMouseDown={vibe}
            style={card}
            className="tile"
          >
            <div style={iconWrap}>
              <img
                src={c.icon}
                alt={c.label}            // si décoratif -> alt="" et aria-hidden="true"
                width={44}
                height={44}
                loading="lazy"
                style={{ display:'block', objectFit:'contain' }}
              />
            </div>

            <div style={{ fontWeight:700 }}>{c.label}</div>
          </a>
        ))}
      </section>

      <style>{css}</style>
    </main>
  );
}

/** styles */
const page: React.CSSProperties = {
  minHeight:'100dvh',
  background:'#F6F7FE',
  fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  color:'#0f172a',
  padding:'16px 20px'
};
const hdr: React.CSSProperties  = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' };
const back: React.CSSProperties = { justifySelf: 'start' };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer', justifySelf:'end' };
const grid: React.CSSProperties  = { display:'grid', gap:16, gridTemplateColumns:'1fr', maxWidth:420, margin:'0 auto' };
const card: React.CSSProperties  = {
  display:'grid', placeItems:'center', gap:8, padding:'26px 12px',
  borderRadius:22, textDecoration:'none', color:'#0f172a',
  border:'1px solid rgba(0,0,0,.06)', boxShadow:'0 8px 18px rgba(0,0,0,.08)',
  background:'linear-gradient(180deg, rgba(var(--theme-color-rgb),0.125) 0%, rgba(var(--theme-color-rgb),0.07) 100%)'
};
const iconWrap: React.CSSProperties = {
  width: 64,
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  background: 'transparent',
  marginBottom: 6
};
const css = `
  .tile:active{ transform:scale(.98); filter:brightness(.98) }
  @media(hover:hover){ .tile:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(0,0,0,.1) } }
`;
