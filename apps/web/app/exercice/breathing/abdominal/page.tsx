'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import { logActivity } from '../../../../lib/patientTracking';

type Phase = 'inhale' | 'hold' | 'exhale' | 'stopped' | 'paused';

const DUR = { inhale: 6, hold: 4, exhale: 6 };           // secondes
const LOOP = ['inhale','hold','exhale'] as const;

function useOrigin() {
  const param = useQueryParam('from', 'app');
  const from = (param === 'hyper' ? 'hyper' : 'app') as 'hyper' | 'app';
  return { backHref: from === 'hyper' ? '/hyperactivation/breathing' : '/app' };
}
function vibe(ms=10){ try{ (navigator as any)?.vibrate?.(ms) }catch{} }

export default function AbdominalBreathing() {
  const { backHref } = useOrigin();

  const [phase, setPhase] = useState<Phase>('stopped');
  const [loopI, setLoopI] = useState(0);
  const [left, setLeft] = useState(DUR.inhale);

  // RAF + timing helpers
  const rafRef = useRef<number | null>(null);
  const stepStartRef = useRef<number>(0);        // timestamp when the current phase started (performance.now())
  const elapsedRef = useRef<number>(0);          // elapsed seconds into the current phase (survives pause)

  // fond doux (même palette que le reste)
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)`,
    []
  );

  // démarrer / pause / stop
  const [loopEnabled, setLoopEnabled] = useState(false);

  function start() {
    setPhase('inhale');
    setLoopI(0);
    setLeft(DUR.inhale);
    elapsedRef.current = 0;
    vibe(10);
    void logActivity({
      category: 'BREATHING',
      subType: 'Respiration abdominale',
      detail: '6-4-6',
    }).catch(console.error);
  }

  function stop(){
    setPhase('stopped');
    setLoopI(0);
    setLeft(DUR.inhale);
    elapsedRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  useEffect(() => {
    // only run when in a running phase
    if (phase === 'stopped' || phase === 'paused') {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // set the logical start time accounting for any previously elapsed (resume)
    stepStartRef.current = performance.now() - (elapsedRef.current * 1000);

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - stepStartRef.current) / 1000; // seconds into current phase
      const key = LOOP[loopI] as keyof typeof DUR;
      const total = DUR[key];
      const remain = Math.max(0, Math.ceil(total - elapsed));
      setLeft(remain);

      if (elapsed >= total) {
        const nextI = (loopI + 1) % LOOP.length;
        const isCycleEnd = loopI === LOOP.length - 1;
        elapsedRef.current = 0;
        if (isCycleEnd && !loopEnabled) {
          stop();
          return;
        }
        setLoopI(nextI);
        setPhase(LOOP[nextI] as Phase);
        setLeft(DUR[LOOP[nextI] as keyof typeof DUR]);

        // small vib on transition
        vibe(6);
        // do not schedule more ticks from here — the useEffect will re-run for the new phase
        return;
      }

      // keep polling
      rafRef.current = requestAnimationFrame(tick);
    };

    // start ticking
    rafRef.current = requestAnimationFrame(tick);

    // cleanup on unmount or deps change
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, loopI, loopEnabled]);

  // libellés
  const title = {
    inhale: 'Inspire par le nez en laissant le ventre se gonfler',
    hold:   'Bloque la respiration',
    exhale: 'Souffle par la bouche en rentrant le ventre'
  } as const;

  const sec = (n:number)=> String(n).padStart(2,'0');

  const isIdle  = phase==='stopped';
  const isRun   = phase==='inhale'||phase==='hold'||phase==='exhale';

  // animation de la bulle (échelle/opacity)
  const bellyScale =
    phase==='inhale' ? 1.25 :
    phase==='hold'   ? 1.25 :
    phase==='exhale' ? 0.85 : 1.0;

  const bellyOpacity =
    phase==='inhale' ? 0.9 :
    phase==='hold'   ? 0.9 :
    phase==='exhale' ? 0.65 : 0.0;

  const waveHeight =
    phase==='inhale' ? '62%' :
    phase==='hold'   ? '52%' :
    phase==='exhale' ? '34%' : '28%';

  return (
    <main style={{ minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 12px', display:'grid', gridTemplateRows:'auto auto 1fr auto', justifyItems:'center', gap:12 }}>
      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr', alignItems:'center', width:'100%', gap:8, justifySelf:'stretch', padding:'0 8px' }}>
        <BackLink href={backHref} style={{ justifySelf: 'start' }} />
        <div>
          <h1 style={{ margin:0, fontSize:18, textAlign:'left' }}>Respiration abdominale</h1>
          <p style={{ margin: '2px 0 0', opacity:.7, fontSize:12, textAlign:'left' }}>
            Cycle 6 – 4 – 6 (inspire, bloque, expire). Inspire par le nez, gonfle le ventre (main du bas), bloque quelques instants, puis souffle par la bouche en rentrant doucement le ventre. Ta main sur la poitrine ne doit pas bouger&nbsp;: respire uniquement avec le ventre.
          </p>
        </div>
      </header>

      {/* Scène */}
      <section style={{ display:'grid', placeItems:'center', width:'100%' }}>
        <div style={sceneBox}>
          {/* Image patient : place tes fichiers dans /public/abdo/ */}
          {/* Variante simple : une seule illustration + bulle par-dessus le ventre */}
          <img src="/abdo/base.png" alt="" style={{ width:'100%', height:'auto', display:'block' }} />

          <div
            aria-hidden
            style={{
              ...wave,
              height: waveHeight
            }}
          />
          <div
            aria-hidden
            style={{
              ...belly,
              transform: `translate(-50%,-50%) scale(${bellyScale})`,
              opacity: bellyOpacity,
            }}
          />
          {/* texte au-dessus de l’illustration */}
          {isRun && (
            <div style={overlayText}>
              <div style={{ fontWeight:700, marginBottom:4 }}>{title[phase as keyof typeof title]}</div>
              <div style={{ opacity:.7, fontVariantNumeric:'tabular-nums' }}>
                {sec(left)} s
              </div>
            </div>
          )}
        </div>
      </section>

      {/* commandes */}
      <div style={controlsWrap}>
        <div style={controlsRow}>
          <button
            onClick={() => { isIdle ? start() : stop(); }}
            style={btnPrimary}
          >
            {isIdle ? 'Début' : 'Stop'}
          </button>
          <button
            onClick={() => setLoopEnabled(v => !v)}
            style={{ ...btnLoop, background: loopEnabled ? 'var(--theme-color)' : '#fff', color: loopEnabled ? '#fff' : '#0f172a' }}
          >
            Loop {loopEnabled ? 'activé' : ''}
          </button>
        </div>
      </div>

      {/* aide */}
    </main>
  );
}

/* ——— Styles ——— */

const sceneBox: React.CSSProperties = {
  position:'relative',
  width:'min(360px, 92vw)',
  aspectRatio:'2/3',
  borderRadius:24,
  overflow:'hidden',
  background:'#fff',
  boxShadow:'0 10px 26px rgba(0,0,0,.06), inset 0 0 0 1px rgba(0,0,0,.04)'
};

// la bulle posée approximativement sur le ventre (centre visuel)
const belly: React.CSSProperties = {
  position:'absolute',
  left:'50%',
  top:'56%',                // ajuste finement si besoin selon ton dessin
  width:'34%',
  aspectRatio:'1/1',
  borderRadius:'50%',
  background:'radial-gradient(60% 60% at 32% 28%, #F5F3FF 0%, #C4B5FD 45%, var(--theme-color) 85%)',
  boxShadow:'0 18px 30px rgba(167,139,250,.35), inset 0 0 0 2px #EDE9FE',
  transition:'transform 600ms ease, opacity 300ms ease'
};

const wave: React.CSSProperties = {
  position:'absolute',
  left:0,
  bottom:0,
  width:'100%',
  background:'linear-gradient(180deg, rgba(var(--theme-color-rgb),0.15), rgba(var(--theme-color-rgb),0.35))',
  transition:'height 600ms ease',
  opacity:0.8
};

const overlayText: React.CSSProperties = {
  position:'absolute',
  top:8,
  left:'50%',
  transform:'translateX(-50%)',
  width:'92%',
  textAlign:'center',
  background:'linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.65))',
  border:'1px solid rgba(0,0,0,.05)',
  borderRadius:12,
  padding:'6px 8px',
  fontSize:12
};

const btn: React.CSSProperties = {
  padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb',
  background:'#fff', cursor:'pointer', fontWeight:700
};
const btnPrimary: React.CSSProperties = {
  padding:'10px 16px', borderRadius:12, border:'1px solid #8B5CF6',
  background:'var(--theme-color)', color:'#fff', fontWeight:800, cursor:'pointer',
  boxShadow:'0 10px 20px rgba(167,139,250,.28)'
};
const btnLoop: React.CSSProperties = {
  padding:'10px 16px', borderRadius:12, border:'1px solid rgba(0,0,0,.08)',
  background:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 12px rgba(0,0,0,.08)'
};
const controlsWrap: React.CSSProperties = {
  width:'100%', maxWidth:460, borderRadius:18, background:'rgba(255,255,255,0.85)', border:'1px solid rgba(0,0,0,0.05)',
  boxShadow:'0 10px 24px rgba(15,23,42,0.08)', padding:'12px 16px', position:'sticky', bottom:12,
  display:'flex', justifyContent:'center', zIndex:5
};
const controlsRow: React.CSSProperties = { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' };
