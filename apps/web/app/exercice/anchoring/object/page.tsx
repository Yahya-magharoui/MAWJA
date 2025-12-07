'use client';

import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../../../components/BackLink';

const QUESTIONS = [
  "De quelle couleur est-il ?",
  "Quelle taille a-t-il ?",
  "Quelle est sa forme ?",
  "En quelle matière est-il ?",
  "Quelle est sa texture ?",
  "À quoi ça sert ?",
  "Est-ce qu’il a une odeur particulière ?",
];

function vibe(ms=12){ try{ (navigator as any)?.vibrate?.(ms) }catch{} }

export default function ObjectSenses() {
  const [started, setStarted] = useState(false);
  const [answered, setAnswered] = useState<boolean[]>(() => {
    // restaure l'état “répondu”
    try { return JSON.parse(localStorage.getItem('anchoring_object_state')||'[]') } catch { return [] }
  });

  useEffect(() => {
    localStorage.setItem('anchoring_object_state', JSON.stringify(answered));
  }, [answered]);

  function mark(i:number){
    setAnswered(prev => {
      const next = [...(prev.length ? prev : Array(QUESTIONS.length).fill(false))];
      next[i] = !next[i];
      return next;
    });
    vibe();
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href="/exercice/anchoring" style={back} />
        <h1 style={{ margin:0, fontSize:20 }}>Ancrage sensoriel</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gear}>⚙️</button>
      </header>

      {!started ? (
        <>
          <p style={{ opacity:.7, fontSize:14, margin:'6px 0 14px' }}>
            Attrape un objet près de toi. Quand tu es prêt·e, lance l’exercice. On va essayer de le décrire en répondant à chaque question.
          </p>
          <div style={{ display:'grid', placeItems:'center', margin:'30px 0' }}>
            <button onClick={() => { setStarted(true); vibe(); }} style={startBtn}>Début</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ opacity:.7, fontSize:14, margin:'6px 0 14px' }}>
            Quand tu as répondu, appuie sur la question (elle change de couleur).
          </p>

          <section style={{ display:'grid', gap:12, maxWidth:720, margin:'0 auto' }}>
            {QUESTIONS.map((q, i) => {
              const on = answered[i];
              return (
                <button key={i} onClick={()=>mark(i)} className="q"
                  style={ bubble(on) }>
                  {q}
                </button>
              );
            })}
          </section>
        </>
      )}

      <footer style={{ display:'flex', justifyContent:'center', margin:'26px 0' }}>
        <a href="/exercice/anchoring" style={linkSecondary}>Terminer</a>
      </footer>

      <style>{css}</style>
    </main>
  );
}

/* styles */
const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 20px' };
const hdr: React.CSSProperties  = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' };
const back: React.CSSProperties = { justifySelf: 'start' };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };

const bubble = (active:boolean): React.CSSProperties => ({
  border:'1px solid rgba(0,0,0,.06)',
  background: active ? 'rgba(var(--theme-color-rgb),0.33)' : '#fff',
  color:'#0f172a',
  borderRadius:16,
  boxShadow:'0 8px 18px rgba(0,0,0,.06)',
  padding:'14px 16px',
  textAlign:'center',
  fontWeight:700,
});

const startBtn: React.CSSProperties = {
  padding:'10px 16px', borderRadius:999, border:'1px solid rgba(0,0,0,.08)',
  background:'var(--theme-color)', color:'#fff', fontWeight:700, boxShadow:'0 8px 18px rgba(0,0,0,.12)', cursor:'pointer'
};
const linkSecondary: React.CSSProperties = {
  padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', color:'#0f172a', textDecoration:'none', fontWeight:600
};

const css = `.q:active{ transform:scale(.985) }`;
