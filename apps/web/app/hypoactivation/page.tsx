'use client';
import { useEffect, useMemo, useState } from 'react';

type CardDef = { key: string; label: string; href: string; icon?: string };

const CARDS: CardDef[] = [
  { key: 'emotions',   label: 'Roue des émotions',        href: '/exercice/emotions',   icon: '/icons/emotion.svg' },
  { key: 'stim-breath',label: 'Respiration stimulante',   href: '/exercice/respiration-boost',   icon: '/icons/stimulante.svg' },
  { key: 'audios',     label: 'Audios rythmés',           href: '/exercice/mindful?mode=rythme', icon: '/icons/audio.svg' },
  { key: 'anchoring',  label: 'Ancrage sensoriel',        href: '/exercice/anchoring',           icon: '/icons/ancrage.svg' },
  { key: 'sba-fast',   label: 'SBA rapides',              href: '/exercice/sba?mode=fast',       icon: '/icons/sba.svg' },
  { key: 'wake-body',  label: 'Exercices pour réveiller le corps', href: '/exercice/wake-body',      icon: '/icons/corps.svg' },
  { key: 'help',       label: 'J’ai besoin d’aide',       href: '/emergency',                     icon: '/icons/aide.svg' },
];

export default function HypoactivationPage() {
  const [color, setColor] = useState('#A78BFA');
  useEffect(() => { const s = localStorage.getItem('themeColor'); if (s) setColor(s); }, []);

  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => { const s = localStorage.getItem('hypoFavs'); if (s) setFavs(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('hypoFavs', JSON.stringify(favs)); }, [favs]);

  function tint(hex:string,t:number){
    const h = hex.replace('#','');
    const [r,g,b] = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
    const mix = (c:number)=>Math.round(c + (255-c)*t);
    const to  = (n:number)=>n.toString(16).padStart(2,'0');
    return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
  }
  const bg = useMemo(()=>`radial-gradient(1200px 800px at 50% -10%, ${tint(color,0.9)} 0%, #F6F7FE 55%)`,[color]);

  function pressFeedback(){ try{ (navigator as any)?.vibrate?.(15) }catch{} }
  function toggleFav(key:string){ setFavs(p=>p.includes(key)?p.filter(k=>k!==key):[...p,key]); }

  // ⬇️ Ajout du marqueur d’origine
  function go(href:string){
    pressFeedback();
    const url = href.includes('?') ? `${href}&from=hypo` : `${href}?from=hypo`;
    window.location.href = url;
  }

  function randomChoice(){
    pressFeedback();
    const list = CARDS.filter(c=>c.key!=='help');
    const pick = list[Math.floor(Math.random()*list.length)];
    document.body.classList.add('shuffle');
    const url = pick.href.includes('?') ? `${pick.href}&from=hypo` : `${pick.href}?from=hypo`;
    setTimeout(()=>{ window.location.href = url; },400);
  }

  // ---------- helper pour afficher l'icône ----------
  function RenderIcon({ icon, size = 44 }: { icon?: string; size?: number }) {
    if (!icon) return <span aria-hidden="true" style={{ fontSize: size }}>🌿</span>;

    // si c'est un chemin (ex: '/icons/foo.svg') -> <img>
    if (typeof icon === 'string' && icon.startsWith('/')) {
      return (
        <img
          src={icon}
          alt=""               // décoratif : le texte label est présent juste en dessous
          aria-hidden="true"
          width={size}
          height={size}
          loading="lazy"
          style={{ display: 'block', objectFit: 'contain' }}
        />
      );
    }

    // sinon, on suppose que c'est un emoji / texte déjà prêt à rendre
    return <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
  }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color:'#0f172a' }}>
      <style>{css}</style>

      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <a href="/app" aria-label="Retour" onMouseDown={pressFeedback} style={{ textDecoration:'none', color:'#111', fontSize:20 }}>←</a>
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Exercices hypoactivation</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, opacity:.7 }}>Sélectionne un exercice pour revenir à ta fenêtre de tolérance</p>
        </div>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button>
      </header>

      <section style={grid}>
        {CARDS.map(c=>(
          <button
            key={c.key}
            type="button"
            onClick={()=>go(c.href)}
            onMouseDown={pressFeedback}
            onTouchStart={pressFeedback}
            className="tile"
            style={{ ...tile(color), position:'relative' }}
          >
            <span
              role="button"
              aria-label={favs.includes(c.key) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              title="Favori"
              onClick={(e)=>{ e.stopPropagation(); toggleFav(c.key); }}
              style={{ position:'absolute', right:10, top:10, fontSize:16, opacity:.6, cursor:'pointer' }}
            >
              {favs.includes(c.key) ? '★' : '☆'}
            </span>

            <div style={{ marginBottom:10 }}>
              <div style={iconWrap}><RenderIcon icon={c.icon} size={44} /></div>
            </div>

            <div style={{ fontWeight:700, fontSize:16, lineHeight:1.2, textAlign:'center' }}>{c.label}</div>
          </button>
        ))}
      </section>

      <div style={{ display:'flex', gap:12, justifyContent:'center', margin:'10px 0 90px' }}>
        <a href="/emergency" onMouseDown={pressFeedback} style={btnSecondary}>J’ai besoin d’aide</a>
      </div>

      <button type="button" onClick={randomChoice} aria-label="Choix aléatoire" style={fab(color)}>🎲</button>
    </main>
  );
}

/* styles */
const gearBtn: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };
const grid: React.CSSProperties = { display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', maxWidth:900, margin:'8px auto 0', padding:'0 20px' };
const tile = (color:string): React.CSSProperties => ({ borderRadius:22, border:'1px solid rgba(0,0,0,.04)', background:`linear-gradient(180deg, ${color}1f 0%, ${color}0f 100%)`, boxShadow:'0 6px 14px rgba(0,0,0,.05)', textAlign:'center', padding:'28px 18px', transition:'transform .12s ease, box-shadow .12s ease, filter .12s ease', outline:'none' });
const iconWrap: React.CSSProperties = {
  width: 64,
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.95)',
  margin: '0 auto 6px',
  boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.02)',
};
const btnSecondary: React.CSSProperties = { padding:'12px 18px', borderRadius:16, border:'1px solid #e5e7eb', background:'#fff', color:'#0f172a', fontWeight:700, textDecoration:'none', boxShadow:'0 4px 10px rgba(0,0,0,.04)' };
const fab = (c:string): React.CSSProperties => ({ position:'fixed', right:20, bottom:20, width:70, height:70, borderRadius:'50%', border:'none', background:c, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 12px 26px rgba(0,0,0,.18)' });
const css = `
  .tile:active { transform: scale(0.975); filter: brightness(0.98); }
  @media (hover:hover){ .tile:hover{ transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.08); } }
  .shuffle * { transition: transform .25s ease; }
`;
