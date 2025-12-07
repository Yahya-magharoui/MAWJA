'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';

/**
 * SBA tactiles — point unique qui clignote uniquement
 * sur les extrémités des épaules (gauche/droite).
 * - Début/Pause
 * - + / – pour la fréquence (0.5–3.0 Hz) : 1 Hz = 1 cycle L→R par seconde
 * - Vibration courte à chaque alternance
 */

export default function SBATactiles() {
  const [running, setRunning] = useState(false);
  const [hz, setHz] = useState(1.0); // 1 cycle par seconde
  const [side, setSide] = useState<'L' | 'R'>('L'); // côté affiché
  const timer = useRef<number | null>(null);

  // un cycle = L puis R → on alterne toutes les demi-périodes
  const halfPeriodMs = useMemo(() => 1000 / (2 * Math.max(0.5, Math.min(3, hz))), [hz]);

  useEffect(() => {
    if (!running) return;
    // on alterne toutes les demi-périodes
    timer.current = window.setInterval(() => {
      setSide((s) => {
        const next = s === 'L' ? 'R' : 'L';
        try { (navigator as any)?.vibrate?.(12); } catch {}
        return next;
      });
    }, halfPeriodMs) as unknown as number;

    return () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  }, [running, halfPeriodMs]);

  function toggle() { setRunning((v) => !v); try { (navigator as any)?.vibrate?.(8); } catch {} }
  function plus()  { setHz((v) => Math.min(3, +(v + 0.1).toFixed(2))); }
  function minus() { setHz((v) => Math.max(0.5, +(v - 0.1).toFixed(2))); }

  return (
    <main style={wrap}>
      <style>{pulseCss}</style>

      <header style={hdr}>
        <BackLink href="/exercice/sba" style={back} />
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Stimulation Bilatérales Alternées</h1>
          <p style={{ margin:'4px 0 0', opacity:.7, fontSize:13 }}>
            Croise les bras sur tes épaules. Le point apparaît alternativement sur chaque épaule.
          </p>
        </div>
        <button aria-label="Paramètres" style={gear}>⚙️</button>
      </header>

      <section style={stage}>
        <EndpointBody side={side} />
      </section>

      <footer style={foot}>
        <button onClick={toggle} style={btnMain}>{running ? 'Pause' : 'Début'}</button>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={plus}  style={mini}>＋</button>
          <button onClick={minus} style={mini}>−</button>
          <span style={{ opacity:.7, fontSize:13 }}>{hz.toFixed(1)} Hz</span>
        </div>
      </footer>
    </main>
  );
}

/** Corps + point qui n’apparaît qu’aux extrémités */
function EndpointBody({ side }: { side: 'L' | 'R' }) {
  const W = 360, H = 300;

  // épaules bien écartées
  const L = { x: 95,  y: 200 };
  const R = { x: 265, y: 200 };

  const dot = side === 'L' ? L : R;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="min(560px, 92vw)" height="auto"
         style={{ filter:'drop-shadow(0 10px 24px rgba(0,0,0,.08))' }}>
      {/* sol/halo */}
      <ellipse cx={(L.x+R.x)/2} cy={L.y+35} rx={115} ry={20} fill="rgba(0,0,0,.06)" />

      {/* tête */}
      <circle cx="180" cy="70" r="30" fill="#fff" stroke="#0f172a" strokeWidth="5" />

      {/* clavicule */}
      <path d={`M ${L.x-25} ${L.y-55} Q ${(L.x+R.x)/2} ${L.y-75} ${R.x+25} ${R.y-55}`}
            fill="none" stroke="#6b7280" strokeWidth="6" strokeLinecap="round" />

      {/* torse */}
      <path d={`M ${L.x-5} ${L.y+22} Q ${(L.x+R.x)/2} ${L.y-22} ${R.x+5} ${R.y+22}`}
            fill="#fff" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />

      {/* bras épais */}
      <path d={`M ${L.x} ${L.y} Q ${(L.x+R.x)/2} ${L.y-38} ${R.x} ${R.y}`}
            fill="none" stroke="#0f172a" strokeWidth="16" strokeLinecap="round" />

      {/* épaules fixes (légère lueur) */}
      <g opacity=".25">
        <circle cx={L.x} cy={L.y} r="20" fill="var(--theme-color)" />
        <circle cx={R.x} cy={R.y} r="20" fill="var(--theme-color)" />
      </g>

      {/* point actif UNIQUEMENT sur l’extrémité courante */}
      <circle
        key={side} /* relance l’anim à chaque alternance */
        className="pulseDot"
        cx={dot.x} cy={dot.y} r="18"
        fill="var(--theme-color)"
        stroke="#6D5BD0" strokeWidth="2"
      />
    </svg>
  );
}

/* ===== styles ===== */
const wrap: React.CSSProperties = {
  minHeight:'100dvh', background:'#F6F7FE',
  fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  color:'#0f172a', padding:'16px 20px', display:'flex', flexDirection:'column'
};
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center', marginBottom:6 };
const back: React.CSSProperties = { justifySelf: 'start' };
const gear: React.CSSProperties = { justifySelf:'end', border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'6px 8px', cursor:'pointer' };
const stage: React.CSSProperties = { flex:1, display:'grid', placeItems:'center' };
const foot:  React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 };
const btnMain: React.CSSProperties = {
  border:'none', padding:'12px 20px', borderRadius:14, background:'var(--theme-color)',
  color:'#fff', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 18px rgba(0,0,0,.16)'
};
const mini: React.CSSProperties = {
  border:'1px solid #e5e7eb', background:'#fff', padding:'8px 14px', borderRadius:999, cursor:'pointer', fontSize:16
};

const pulseCss = `
  .pulseDot {
    transform-origin: center;
    animation: pulse 420ms ease-out;
  }
  @keyframes pulse {
    from { transform: scale(.85); filter: drop-shadow(0 0 0 rgba(var(--theme-color-rgb),0)); }
    60% { transform: scale(1.06); filter: drop-shadow(0 6px 14px rgba(var(--theme-color-rgb),.55)); }
    to   { transform: scale(1.00); filter: drop-shadow(0 4px 10px rgba(var(--theme-color-rgb),.35)); }
  }
`;
