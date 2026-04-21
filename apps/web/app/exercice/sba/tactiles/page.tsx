'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { logActivity } from '../../../../lib/patientTracking';

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

  function toggle() {
    setRunning((v) => {
      const next = !v;
      if (next) {
        void logActivity({
          category: 'SBA',
          subType: 'Tactile',
          detail: `${hz.toFixed(1)} Hz`,
        }).catch(console.error);
      }
      return next;
    });
    try { (navigator as any)?.vibrate?.(8); } catch {}
  }
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
  const bubble = side === 'L' ? styles.bubbleLeft : styles.bubbleRight;
  return (
    <div style={{ position:'relative', width:'min(360px, 75vw)', maxWidth:360 }}>
      <img
        src="/icons/hug.png"
        alt="Bras croisés sur les épaules"
        style={{ width:'100%', height:'auto', display:'block', filter:'drop-shadow(0 14px 32px rgba(15,23,42,.15))' }}
      />
      <span key={side} className="shoulderBubble" style={bubble} />
    </div>
  );
}

/* ===== styles ===== */
const wrap: React.CSSProperties = {
  minHeight:'100vh',
  background:'#F6F7FE',
  fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  color:'#0f172a',
  padding:'16px 20px 18px',
  display:'grid',
  gridTemplateRows:'auto 1fr auto',
  gap:10
};
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center', marginBottom:6 };
const back: React.CSSProperties = { justifySelf: 'start' };
const gear: React.CSSProperties = { justifySelf:'end', border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'6px 8px', cursor:'pointer' };
const stage: React.CSSProperties = { display:'grid', placeItems:'center', padding:'4px 0', minHeight:0 };
const foot:  React.CSSProperties = {
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  gap:16,
  flexWrap:'wrap'
};
const btnMain: React.CSSProperties = {
  border:'none', padding:'12px 20px', borderRadius:14, background:'var(--theme-color)',
  color:'#fff', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 18px rgba(0,0,0,.16)'
};
const mini: React.CSSProperties = {
  border:'1px solid #e5e7eb', background:'#fff', padding:'8px 14px', borderRadius:999, cursor:'pointer', fontSize:16
};
const styles = {
  bubbleLeft: {
    left: '18%',
    top: '62%',
    transform: 'translate(-50%, -50%)'
  },
  bubbleRight: {
    left: '82%',
    top: '44%',
    transform: 'translate(-50%, -50%)'
  }
} satisfies Record<string, React.CSSProperties>;

const pulseCss = `
  .shoulderBubble {
    position:absolute;
    width:78px;
    height:78px;
    border-radius:999px;
    background:var(--theme-color);
    border:2px solid #6D5BD0;
    animation:pulse 400ms ease-out;
    box-shadow:0 14px 24px rgba(var(--theme-color-rgb),0.35);
  }
  @keyframes pulse {
    from { transform:scale(.75); opacity:.5; }
    70% { transform:scale(1.05); opacity:1; }
    to { transform:scale(1); opacity:1; }
  }
`;
