'use client';

import { useEffect, useState } from 'react';

type SenseRow = { icon: string; label: string; target: number; key: string };

const ROWS: SenseRow[] = [
  { key: 'see',   icon: '/icons/eye.svg',  label: '5 choses que tu peux voir',     target: 5 },
  { key: 'touch', icon: '/icons/main.svg', label: '4 choses que tu peux toucher',   target: 4 },
  { key: 'hear',  icon: '/icons/hear.svg', label: '3 choses que tu peux entendre',  target: 3 },
  { key: 'smell', icon: '/icons/senss.svg',label: '2 choses que tu peux sentir',    target: 2 },
  { key: 'taste', icon: '/icons/taste.svg',label: '1 chose que tu peux goûter',     target: 1 },
];

function vibe(ms = 12) { try { (navigator as any)?.vibrate?.(ms); } catch {} }

// — util: objet {see:0, touch:0,...}
const zeroCounts = ROWS.reduce<Record<string, number>>((acc, r) => { acc[r.key] = 0; return acc; }, {});

/* ---------- helper: rend une icône
   - si `icon` commence par "/" -> on considère que c'est un chemin vers public/ -> <img>
   - sinon on rend tel quel (emoji / texte)
   - alt="" + aria-hidden car le label textuel est présent juste à côté */
function RenderIcon({ icon, size = 28 }: { icon?: string; size?: number }) {
  if (!icon) return <span aria-hidden="true" style={{ fontSize: size }}>🎧</span>;

  if (typeof icon === 'string' && icon.startsWith('/')) {
    return (
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        style={{ display: 'block', objectFit: 'contain' }}
      />
    );
  }

  return <span aria-hidden="true" style={{ fontSize: size }}>{icon}</span>;
}

export default function FiveFourThreeTwoOne() {
  // ⛔️ plus de localStorage -> on part de zéro à chaque ouverture
  const [counts, setCounts] = useState<Record<string, number>>(zeroCounts);

  // (Option si tu veux garder l’état tant que l’onglet est ouvert)
  // useEffect(() => {
  //   const saved = sessionStorage.getItem('anchoring_54321');
  //   if (saved) setCounts(JSON.parse(saved));
  // }, []);
  // useEffect(() => {
  //   sessionStorage.setItem('anchoring_54321', JSON.stringify(counts));
  // }, [counts]);

  const doneAll = ROWS.every(r => (counts[r.key] || 0) >= r.target);

  useEffect(() => {
    if (doneAll) {
      vibe(25);
      const t = setTimeout(() => { window.location.href = '/exercice/anchoring'; }, 900);
      return () => clearTimeout(t);
    }
  }, [doneAll]);

  function inc(k: string, max: number) {
    setCounts(prev => {
      const cur = prev[k] || 0;
      if (cur >= max) return prev;
      return { ...prev, [k]: cur + 1 };
    });
    vibe();
  }

  function resetAll() {
    vibe();
    setCounts(zeroCounts); // retour à zéro
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <a href="/exercice/anchoring" aria-label="Retour" style={back}>←</a>
        <h1 style={{ margin: 0, fontSize: 20 }}>Ancrage sensoriel 5-4-3-2-1</h1>
        <button onClick={resetAll} style={resetBtn}>Recommencer</button>
      </header>

      <section style={{ maxWidth: 760, margin: '8px auto 0', display: 'grid', gap: 16, padding: '0 12px' }}>
        {ROWS.map((r) => {
          const cur = counts[r.key] || 0;
          const finished = cur >= r.target;
          return (
            <article key={r.key} style={row}>
              <div style={left}>
                <div style={icon}>
                  <div style={iconInner}>
                    <RenderIcon icon={r.icon} size={22} />
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{r.label}</div>
              </div>
              <button
                onClick={() => inc(r.key, r.target)}
                className="counter"
                aria-label={`Ajouter 1 (${cur}/${r.target})`}
                style={counter(finished)}
              >
                {finished ? '✔︎' : `${cur}/${r.target}`}
              </button>
            </article>
          );
        })}
      </section>

      {doneAll && (
        <div style={{ textAlign: 'center', margin: '14px 0', fontWeight: 700 }}>
          Bravo, exercice terminé !
        </div>
      )}

      <style>{css}</style>
    </main>
  );
}

/* styles */
const wrap: React.CSSProperties = { minHeight: '100dvh', background: '#F6F7FE', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color: '#0f172a', padding: '16px 20px' };
const hdr: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 10 };
const back: React.CSSProperties = { textDecoration: 'none', color: '#111', fontSize: 20 };
const resetBtn: React.CSSProperties = { border: '1px solid #e5e7eb', background: '#fff', padding: '8px 10px', borderRadius: 12, cursor: 'pointer', fontWeight: 600 };

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, border: '1px solid rgba(0,0,0,.06)', borderRadius: 18, padding: '12px 14px', background: '#fff', boxShadow: '0 8px 18px rgba(0,0,0,.06)' };
const left: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
// wrapper d'icône (carré coloré)
const icon: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#A78BFA33' };
// inner pour centrer l'<img> proprement
const iconInner: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const counter = (ok: boolean): React.CSSProperties => ({
  minWidth: 64, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,.08)',
  background: ok ? '#A7F3D0' : '#A78BFA', color: '#fff', fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(0,0,0,.10)',
});

const css = `.counter:active{ transform:scale(.97) }`;
