'use client';
import { useMemo } from 'react';
import BackLink from '../../../components/BackLink';
import { useQueryParam } from '../../../hooks/useQueryParam';

function useOrigin() {
  const fromParam = useQueryParam('from', 'hyper');
  const from = (fromParam === 'hypo' ? 'hypo' : 'hyper') as 'hyper' | 'hypo';
  const backHref = from === 'hypo' ? '/hypoactivation' : '/hyperactivation';
  const withFrom = (href: string) => href.includes('?') ? `${href}&from=${from}` : `${href}?from=${from}`;
  return { from, backHref, withFrom };
}

export default function WakeBodyHome() {
  const { backHref, withFrom } = useOrigin();

  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)`,
    []
  );

  function vibe(ms=15){ try{ (navigator as any)?.vibrate?.(ms) }catch{} }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' }}>
      <style>{css}</style>

      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <BackLink href={backHref} style={{ justifySelf: 'start' }} />
        <h1 style={{ margin:0, fontSize:20 }}>Exercices pour réveiller le corps</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button>
      </header>

      <p style={{ margin:'6px 20px 14px', opacity:.7, fontSize:14 }}>Sélectionne un exercice</p>

      <section style={grid}>
        <a
          href={withFrom('/exercice/wake-body/mini')}
          onMouseDown={()=>vibe()}
          className="tile"
          style={tile}
        >
          <div style={{ fontSize:34, marginBottom:8 }}>
            {/* affiche l'icône réelle depuis public/icons/exercices.svg */}
            <img src="/icons/exercices.svg" alt="Mini exercices" width={48} height={48} style={{ display:'inline-block' }} />
          </div>
          <div style={{ fontWeight:700 }}>Mini exercices</div>
        </a>

        <a
          href={withFrom('/exercice/wake-body/program')}
          onMouseDown={()=>vibe()}
          className="tile"
          style={tile}
        >
          <div style={{ fontSize:34, marginBottom:8 }}>
            <img src="/icons/programme.svg" alt="Programme" width={48} height={48} style={{ display:'inline-block' }} />
          </div>
          <div style={{ fontWeight:700 }}>Programme</div>
        </a>
      </section>

      <div style={{ textAlign:'center', margin:'18px 0 80px', opacity:.6, fontSize:12 }}>
        Astuce : utilise un casque si tu actives les sons.
      </div>
    </main>
  );
}

const gearBtn: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };

const grid: React.CSSProperties = {
  display:'grid',
  gap:16,
  gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
  maxWidth: 700,
  margin: '10px auto 0',
  padding: '0 20px'
};

const tile: React.CSSProperties = {
  display:'grid', placeItems:'center', gap:8,
  borderRadius:22,
  border:'1px solid rgba(0,0,0,.06)',
  background:'linear-gradient(180deg, rgba(var(--theme-color-rgb),0.12) 0%, rgba(var(--theme-color-rgb),0.07) 100%)',
  padding:'28px 18px',
  textDecoration:'none',
  color:'#0f172a',
  boxShadow:'0 8px 18px rgba(0,0,0,.06)',
};

const css = `
  .tile:active{ transform:scale(.98); filter:brightness(.98) }
`;
