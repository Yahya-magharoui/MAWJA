'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Phase = 'inhale' | 'hold' | 'exhale' | 'stopped' | 'paused';

const DUR = { inhale: 6, hold: 4, exhale: 6 };           // secondes
const LOOP = ['inhale','hold','exhale'] as const;

function useOrigin() {
  const sp = useSearchParams();
  const from = (sp.get('from') === 'hyper' ? 'hyper' : 'app') as 'hyper'|'app';
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
    () => `radial-gradient(1200px 800px at 50% -10%, #A78BFA22 0%, #F6F7FE 55%)`,
    []
  );

  // démarrer / pause / stop
  function start() {
    // start fresh
    setPhase('inhale');
    setLoopI(0);
    setLeft(DUR.inhale);
    elapsedRef.current = 0;
    vibe(10);
  }

  function pause(){
    if (phase === 'paused' || phase === 'stopped') return;
    // compute elapsed so far and cancel RAF
    if (stepStartRef.current) {
      const now = performance.now();
      elapsedRef.current = (now - stepStartRef.current) / 1000;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase('paused');
  }

  function resume(){
    if (phase !== 'paused') return;
    // resume current phase (loopI holds the phase index)
    setPhase(LOOP[loopI] as Phase);
    // stepStart will be set in effect using elapsedRef
  }

  function stop(){
    setPhase('stopped');
    setLoopI(0);
    setLeft(DUR.inhale);
    elapsedRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  // minuterie : gère inhale/hold/exhale cycles
  useEffect(() => {
    // only run when in a running phase
    if (phase === 'stopped' || phase === 'paused') {
      // ensure raf canceled
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
        // transition to next phase
        const nextI = (loopI + 1) % LOOP.length;
        // reset elapsed for next phase so it starts fresh
        elapsedRef.current = 0;
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
  }, [phase, loopI]);

  // libellés
  const title = {
    inhale: 'Inspire par le nez en laissant le ventre se gonfler',
    hold:   'Bloque la respiration',
    exhale: 'Souffle par la bouche en rentrant le ventre'
  } as const;

  const sec = (n:number)=> String(n).padStart(2,'0');

  const isIdle  = phase==='stopped';
  const isRun   = phase==='inhale'||phase==='hold'||phase==='exhale';
  const isPause = phase==='paused';

  // animation de la bulle (échelle/opacity)
  const bellyScale =
    phase==='inhale' ? 1.25 :
    phase==='hold'   ? 1.25 :
    phase==='exhale' ? 0.85 : 1.0;

  const bellyOpacity =
    phase==='inhale' ? 0.9 :
    phase==='hold'   ? 0.9 :
    phase==='exhale' ? 0.65 : 0.0;

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' }}>
      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <a href={backHrefWithFallback()} aria-label="Retour" style={{ textDecoration:'none', color:'#111', fontSize:20 }}>←</a>
        <h1 style={{ margin:0, fontSize:20 }}>Respiration abdominale</h1>
        <div />
      </header>

      <p style={{ margin:'4px auto 10px', textAlign:'center', opacity:.7 }}>
        Cycle 6 – 4 – 6 (inspire, bloque, expire)
      </p>

      {/* Scène */}
      <section style={{ display:'grid', placeItems:'center' }}>
        <div style={sceneBox}>
          {/* Image patient : place tes fichiers dans /public/abdo/ */}
          {/* Variante simple : une seule illustration + bulle par-dessus le ventre */}
          <img src="/abdo/base.png" alt="" style={{ width:'100%', height:'auto', display:'block' }} />

          {/* bulle violette sur le ventre */}
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
      <div style={{ display:'flex', gap:10, justifyContent:'center', margin:'14px 0 28px' }}>
        {isIdle  && <button onClick={start}  style={btnPrimary}>Démarrer</button>}
        {isRun   && <button onClick={pause}  style={btn}>Pause</button>}
        {isPause && <button onClick={resume} style={btnPrimary}>Reprendre</button>}
        {!isIdle && <button onClick={stop} style={btnGhost}>Arrêter</button>}
      </div>

      {/* aide */}
      <div style={{ maxWidth:680, margin:'0 auto 26px', padding:'0 20px', fontSize:13, opacity:.7, textAlign:'center' }}>
        L’air entre par le nez, gonfle le ventre (main du bas), puis tu bloques, et enfin tu
        souffles par la bouche en rentrant doucement le ventre.
      </div>
    </main>
  );

  // helper local : backHref peut provenir de query param "from"; on recrée rapidement ici pour éviter
  // dépendance visuelle : si useSearchParams n'est pas disponible pour une raison X, on fallback to '/app'
  function backHrefWithFallback() {
    try {
      const sp = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
      const from = sp?.get('from') === 'hyper' ? 'hyper' : 'app';
      return from === 'hyper' ? '/hyperactivation/breathing' : '/app';
    } catch {
      return '/app';
    }
  }
}

/* ——— Styles ——— */

const sceneBox: React.CSSProperties = {
  position:'relative',
  width:'min(520px, 92vw)',
  aspectRatio:'3/4',
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
  background:'radial-gradient(60% 60% at 32% 28%, #F5F3FF 0%, #C4B5FD 45%, #A78BFA 85%)',
  boxShadow:'0 18px 30px rgba(167,139,250,.35), inset 0 0 0 2px #EDE9FE',
  transition:'transform 600ms ease, opacity 300ms ease'
};

const overlayText: React.CSSProperties = {
  position:'absolute',
  top:12,
  left:'50%',
  transform:'translateX(-50%)',
  width:'90%',
  textAlign:'center',
  background:'linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.65))',
  border:'1px solid rgba(0,0,0,.05)',
  borderRadius:12,
  padding:'8px 10px',
  fontSize:14
};

const btn: React.CSSProperties = {
  padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb',
  background:'#fff', cursor:'pointer', fontWeight:700
};
const btnPrimary: React.CSSProperties = {
  padding:'10px 16px', borderRadius:12, border:'1px solid #8B5CF6',
  background:'#A78BFA', color:'#fff', fontWeight:800, cursor:'pointer',
  boxShadow:'0 10px 20px rgba(167,139,250,.28)'
};
const btnGhost: React.CSSProperties = {
  padding:'10px 14px', borderRadius:12, border:'1px solid #fecaca',
  background:'#fee2e2', color:'#991b1b', fontWeight:800, cursor:'pointer'
};
