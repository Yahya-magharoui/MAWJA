'use client';
import { useEffect, useMemo, useState } from 'react';

type CardDef = { key: string; label: string; href: string; icon?: string };

const CARDS: CardDef[] = [
  { key: 'emotions',   label: 'Roue des émotions',        href: '/exercice/emotions',   icon: '/icons/emotion.svg' },
  { key: 'safeplace',  label: 'Sécurisation (lieu sûr)',  href: '/exercice/safe-place', icon: '/icons/lieusur.svg' },
  { key: 'mindful',    label: 'Audios pleine conscience', href: '/exercice/mindful',    icon: '/icons/audio.svg' },
  { key: 'anchoring',  label: 'Ancrage sensoriel',        href: '/exercice/anchoring',  icon: '/icons/ancrage.svg' },
  { key: 'sba',        label: 'SBA lentes',               href: '/exercice/sba',        icon: '/icons/sba.svg' },
  { key: 'coherence',  label: 'Exercices de respiration',      href: '/exercice/breathing',  icon: '/icons/breathing.svg' },
  { key: 'abdominal',  label: 'Trousses de sécurité émotionnelle',   href: '/exercice/trousse',  icon: '/icons/trousse.svg' },
  { key: 'help',       label: 'J’ai besoin d’aide',       href: '/emergency',           icon: '/icons/aide.svg' },


];

export default function HyperactivationPage() {
  const [color, setColor] = useState('#A78BFA');
  useEffect(() => { const saved = localStorage.getItem('themeColor'); if (saved) setColor(saved); }, []);

  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => { const saved = localStorage.getItem('hyperFavs'); if (saved) setFavs(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('hyperFavs', JSON.stringify(favs)); }, [favs]);

  function tint(hex: string, t: number) {
    const h = hex.replace('#', '');
    const [r,g,b] = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
    const mix = (c:number)=>Math.round(c+(255-c)*t);
    const to  = (n:number)=>n.toString(16).padStart(2,'0');
    return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
  }
  const bg = useMemo(() => `radial-gradient(1200px 800px at 50% -10%, ${tint(color,0.9)} 0%, #F6F7FE 55%)`, [color]);

  function pressFeedback(){ try{ (navigator as any)?.vibrate?.(15) }catch{} }
  function toggleFav(key:string){ setFavs(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]); }

  // ⬇️ Ajout du marqueur d’origine
  function go(href: string) {
    pressFeedback();
    const url = href.includes('?') ? `${href}&from=hyper` : `${href}?from=hyper`;
    window.location.href = url;
  }

  function randomChoice() {
    pressFeedback();
    const pick = CARDS[Math.floor(Math.random() * CARDS.length)];
    document.body.classList.add('shuffle');
    const url = pick.href.includes('?') ? `${pick.href}&from=hyper` : `${pick.href}?from=hyper`;
    setTimeout(() => { window.location.href = url; }, 400);
  }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color:'#0f172a' }}>
      <style>{css}</style>

      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <a href="/app" aria-label="Retour" style={{ textDecoration:'none', color:'#111', fontSize:20 }}>←</a>
        <h1 style={{ margin:0, fontSize:20, textAlign:'center' }}>Exercices hyperactivation</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button>
      </header>

      <p style={{ margin:'0 auto 12px', opacity:.7, fontSize:16, textAlign:'center', maxWidth:700 }}>
        Choisis un exercice pour retrouver ton équilibre.
      </p>

      <section style={grid}>
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => go(c.href)}
            onMouseDown={pressFeedback}
            onTouchStart={pressFeedback}
            className="tile"
            style={{ ...tile(color), position:'relative' }}
          >
            <span
              role="button"
              aria-label={favs.includes(c.key) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              title="Favori"
              onClick={(e) => { e.stopPropagation(); toggleFav(c.key); }}
              style={{ position:'absolute', right:10, bottom:10, fontSize:16, opacity:.6, cursor:'pointer' }}
            >
              {favs.includes(c.key) ? '★' : '☆'}
            </span>
            {/* <div style={{ fontSize:36, marginBottom:10 }}>{c.icon ?? '🌿'}</div> */}

            <div style={{ marginBottom: 10 }}>
              <img
                src={c.icon ?? '/icons/default.svg'}
                alt={c.label}
                style={{ width: 48, height: 48, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontWeight:700, fontSize:16 }}>{c.label}</div>
          </button>
        ))}
      </section>

      <div style={{ display:'flex', gap:12, justifyContent:'center', margin:'10px 0 90px' }}>
        <a href="/emergency" style={btnSecondary}>J’ai besoin d’aide</a>
      </div>

      <button type="button" onClick={randomChoice} aria-label="Choix aléatoire" style={fab(color)}>🎲</button>
    </main>
  );
}

/* styles */
const gearBtn: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };
const grid: React.CSSProperties = { display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', maxWidth:900, margin:'10px auto 0', padding:'0 20px' };
const tile = (color:string): React.CSSProperties => ({ borderRadius:22, border:'1px solid rgba(0,0,0,.04)', background:`linear-gradient(180deg, ${color}1f 0%, ${color}0f 100%)`, boxShadow:'0 6px 14px rgba(0,0,0,.05)', textAlign:'center', padding:'28px 18px', transition:'transform .12s ease, box-shadow .12s ease, filter .12s ease', outline:'none' });
const btnSecondary: React.CSSProperties = { padding:'12px 18px', borderRadius:16, border:'1px solid #e5e7eb', background:'#fff', color:'#0f172a', fontWeight:700, textDecoration:'none', boxShadow:'0 4px 10px rgba(0,0,0,.04)' };
const fab = (c:string): React.CSSProperties => ({ position:'fixed', right:20, bottom:20, width:70, height:70, borderRadius:'50%', border:'none', background:c, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 12px 26px rgba(0,0,0,.18)' });
const css = `
  .tile:active { transform: scale(0.975); filter: brightness(0.98); }
  @media (hover:hover){ .tile:hover{ transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.08); } }
  .shuffle * { transition: transform .25s ease; }
`;
