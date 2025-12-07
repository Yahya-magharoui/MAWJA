'use client';

import { useEffect, useState } from 'react';
import BackLink from '../../../../components/BackLink';

type SafePlace = { id:string; name:string; answers:string[]; createdAt:number };

const LS_KEY = 'safePlacesV1';

function vibe(ms=12){ try { (navigator as any)?.vibrate?.(ms) } catch {} }

export default function VisitSafePlace() {
  const [items, setItems] = useState<SafePlace[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // modale détails

  /* charge */
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch {}
    const url = new URL(window.location.href);
    const h = url.searchParams.get('highlight');
    if (h) setHighlight(h);
  }, []);

  /* scroll vers le dernier ajouté si besoin */
  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`sp-${highlight}`);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
  }, [highlight, items.length]);

  function saveToLS(next: SafePlace[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function remove(id: string) {
    vibe();
    const ok = confirm('Supprimer ce lieu sûr ? Cette action est définitive.');
    if (!ok) return;
    setItems(prev => {
      const next = prev.filter(x => x.id !== id);
      saveToLS(next);
      return next;
    });
  }

  const selected = openId ? items.find(i => i.id === openId) : null;

  return (
    <main style={wrap}>
      <style>{css}</style>

      <header style={hdr}>
        <BackLink href="/exercice/safe-place" style={back} />
        <h1 style={{ margin:0, fontSize:20 }}>Mon lieu sûr</h1>
        <a href="/exercice/safe-place/build" style={newBtn} onMouseDown={()=>vibe()}>+ Nouveau</a>
      </header>

      {items.length === 0 ? (
        <section style={{ maxWidth:780, margin:'18px auto', padding:'0 20px' }}>
          <div style={emptyCard}>
            <p style={{ margin:'0 0 10px', fontWeight:700 }}>Tu n’as pas encore créé de lieu sûr.</p>
            <a href="/exercice/safe-place/build" style={primary}>Créer mon premier lieu</a>
          </div>
        </section>
      ) : (
        <section style={{ maxWidth:900, margin:'6px auto 24px', padding:'0 16px', display:'grid', gap:16 }}>
          {items.map((sp) => (
            <article
              key={sp.id}
              id={`sp-${sp.id}`}
              className={sp.id === highlight ? 'card pulse' : 'card'}
              style={card(sp.id === highlight)}
            >
              <div style={headerRow}>
                <div style={circle}>{(sp.name || 'L').slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{ fontWeight:800, lineHeight:1.2 }}>{sp.name || 'Mon lieu sûr'}</div>
                  <div style={{ opacity:.6, fontSize:12 }}>
                    {new Date(sp.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* actions à droite */}
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    style={ghost}
                    onClick={()=>{ vibe(); setOpenId(sp.id); }}
                    title="Voir les détails"
                  >
                    Voir les détails
                  </button>
                  <button
                    style={danger}
                    onClick={()=>remove(sp.id)}
                    title="Supprimer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* chips récap rapides */}
              <div style={chipsWrap}>
                {sp.answers?.map((a, i) => a?.trim()
                  ? <span key={i} style={chip}>{a.trim()}</span>
                  : null)}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* modale détails */}
      {selected && (
        <div className="modal" onClick={()=>setOpenId(null)}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h2 style={{ margin:0, fontSize:18 }}>{selected.name || 'Mon lieu sûr'}</h2>
              <button style={ghost} onClick={()=>setOpenId(null)}>Fermer</button>
            </div>
            <div style={{ display:'grid', gap:10, maxHeight:'60vh', overflow:'auto' }}>
              {selected.answers?.map((a,i)=>(
                <div key={i} style={qa}>
                  <div style={q}>Réponse {i+1}</div>
                  <div style={aTxt}>{a || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* styles */
const wrap:React.CSSProperties={ minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 20px' };
const hdr:React.CSSProperties={ display:'grid', gridTemplateColumns:'40px 1fr auto', alignItems:'center' };
const back:React.CSSProperties={ justifySelf:'start' };

const newBtn:React.CSSProperties={ padding:'8px 12px', borderRadius:12, background:'var(--theme-color)', color:'#fff', textDecoration:'none', fontWeight:700, border:'1px solid rgba(0,0,0,.08)', boxShadow:'0 6px 14px rgba(0,0,0,.12)' };

const emptyCard:React.CSSProperties={ border:'1px solid rgba(0,0,0,.06)', borderRadius:18, padding:'16px', background:'#fff', boxShadow:'0 8px 18px rgba(0,0,0,.06)' };
const primary:React.CSSProperties={ padding:'10px 14px', borderRadius:12, background:'var(--theme-color)', color:'#fff', textDecoration:'none', fontWeight:700 };

const card = (hl:boolean):React.CSSProperties => ({
  border:'1px solid rgba(0,0,0,.06)', borderRadius:22, background:'#fff',
  boxShadow: hl ? '0 12px 26px rgba(var(--theme-color-rgb),.35)' : '0 8px 18px rgba(0,0,0,.06)',
  padding:'14px 14px 12px'
});
const headerRow:React.CSSProperties={ display:'flex', alignItems:'center', gap:12, marginBottom:10 };
const circle:React.CSSProperties={ width:44, height:44, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(var(--theme-color-rgb),0.2)', fontWeight:800 };

const chipsWrap:React.CSSProperties={ display:'flex', flexWrap:'wrap', gap:8 };
const chip:React.CSSProperties={ padding:'8px 10px', borderRadius:999, background:'#F1F0FF', border:'1px solid #E6E3FF', fontSize:13 };

const ghost:React.CSSProperties={ padding:'8px 12px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', fontWeight:600, cursor:'pointer' };
const danger:React.CSSProperties={ padding:'8px 12px', borderRadius:12, border:'1px solid #ef4444', background:'#fff', color:'#b91c1c', fontWeight:700, cursor:'pointer' };

const qa:React.CSSProperties={ border:'1px solid #e5e7eb', borderRadius:12, padding:'10px 12px', background:'#fff' };
const q:React.CSSProperties={ fontSize:12, opacity:.6, marginBottom:4 };
const aTxt:React.CSSProperties={ whiteSpace:'pre-wrap' };

const css = `
  .pulse{ animation: pulse 1.2s ease 2; }
  @keyframes pulse{
    0%{ transform:scale(1); box-shadow:0 12px 26px rgba(167,139,250,.0) }
    50%{ transform:scale(1.01); box-shadow:0 14px 30px rgba(167,139,250,.45) }
    100%{ transform:scale(1); box-shadow:0 12px 26px rgba(167,139,250,.0) }
  }
  .modal{
    position: fixed; inset: 0; background: rgba(15,23,42,.35);
    display: grid; place-items: center; padding: 16px; z-index: 50;
  }
  .sheet{
    width: min(720px, 96vw); background: #fff; border-radius: 16px;
    border: 1px solid rgba(0,0,0,.08); box-shadow: 0 20px 40px rgba(0,0,0,.18);
    padding: 14px;
  }
`;
