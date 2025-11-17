'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'inspire' | 'expire' | 'stopped' | 'paused';

const PROTO = { inhaleSec: 5, exhaleSec: 5, sessionMin: 5 };
const CYCLES_PER_MIN = 60 / (PROTO.inhaleSec + PROTO.exhaleSec);
const TARGET_CYCLES = Math.round(PROTO.sessionMin * CYCLES_PER_MIN);

function vibe(ms = 12) { try { (navigator as any)?.vibrate?.(ms); } catch {} }

export default function BreathingTube() {
  const [phase, setPhase] = useState<Phase>('stopped');
  const [cycle, setCycle] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showTip, setTip] = useState(true);

  const yRef = useRef<'top'|'bottom'>('bottom');
  const rafRef = useRef<number | null>(null);
  const stepStart = useRef<number>(0);
  const audioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const phaseDuration = useMemo(
    () => (phase === 'inspire' ? PROTO.inhaleSec : phase === 'expire' ? PROTO.exhaleSec : 0) * 1000,
    [phase]
  );

  // ——— chime + fort (seulement volume/durée changés)
  function chime() {
    if (muted) return;
    try {
      if (!audioRef.current) {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        audioRef.current = new Ctx();
        gainRef.current = audioRef.current.createGain();
        gainRef.current.gain.value = 0.18; // avant 0.08 -> + fort
        gainRef.current.connect(audioRef.current.destination);
      }
      const ctx = audioRef.current!;
      const bus = gainRef.current!;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = yRef.current === 'top' ? 540 : 420;

      const env = ctx.createGain();
      env.gain.value = 0.0001;
      osc.connect(env); env.connect(bus);

      const t0 = ctx.currentTime;
      osc.start(t0);
      env.gain.exponentialRampToValueAtTime(0.16, t0 + 0.03);   // avant 0.06
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30); // un peu plus long
      osc.stop(t0 + 0.32);
    } catch {}
  }

  useEffect(() => {
    if (phase === 'stopped' || phase === 'paused') return;
    stepStart.current = performance.now();
    yRef.current = phase === 'inspire' ? 'top' : 'bottom';
    chime(); vibe(8);
    if (showTip) setTip(false);

    const tick = () => {
      const now = performance.now();
      const elapsed = now - stepStart.current;
      if (elapsed >= phaseDuration) {
        if (phase === 'inspire') {
          setPhase('expire');
        } else {
          const next = cycle + 1;
          setCycle(next);
          if (next >= TARGET_CYCLES) {
            setPhase('stopped');
            yRef.current = 'bottom';
            return;
          }
          setPhase('inspire');
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, phaseDuration, cycle, showTip]);

  function start() { setCycle(0); setPhase('inspire'); }
  function pause() { setPhase('paused'); }
  function resume() { setPhase('inspire'); }
  function stop() {
    setPhase('stopped'); setCycle(0);
    yRef.current = 'bottom'; setTip(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }

  const isIdle  = phase === 'stopped';
  const isRun   = phase === 'inspire' || phase === 'expire';
  const isPause = phase === 'paused';

  const motion = isRun ? `${phaseDuration}ms cubic-bezier(.22,.65,.2,1)` : '280ms ease';

  return (
    <main style={page}>
      <style>{css}</style>

      <header style={hdr}>
        <a href="/hyperactivation" aria-label="Retour" style={back}>←</a>
        <h1 style={{ margin:0, fontSize:18, color:'#4B5563' }}>Cohérence cardiaque</h1>
        <button
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
          title={muted ? 'Activer le son' : 'Couper le son'}
          onClick={() => setMuted(m => !m)}
          style={muteBtn}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <section style={scene}>
        <div style={tube}>
          <div
            style={{
              ...fill,
              transform: yRef.current === 'top' ? 'translateY(0%)' : 'translateY(100%)',
              transition: motion
            }}
          />
          {/* ——— bulle va jusqu’aux bords (2% de marge visuelle) */}
          <div
            style={{
              ...bubble,
              transform: yRef.current === 'top'
                ? 'translate(-50%, 2%)'
                : 'translate(-50%, 600%)',
                // : 'translate(-50%, calc(100% - 2%))',
              transition: motion
            }}
          >
            <div style={shine}/>
          </div>
        </div>

        <div style={caption}>
          {isIdle && <span>Appuie sur « Démarrer »</span>}
          {isRun && (yRef.current === 'top' ? <span>Inspirez…</span> : <span>Expirez…</span>)}
          {isPause && <span>En pause</span>}
        </div>
        <div style={{ fontSize:12, opacity:.65, color:'#6B7280', marginTop:6 }}>
          365 • {PROTO.sessionMin} min • 6 cycles/min — Cycle {Math.min(cycle + (phase==='expire'?1:0), TARGET_CYCLES)} / {TARGET_CYCLES}
        </div>
      </section>

      <footer style={controls}>
        {isIdle  && <button onClick={start}  style={btnPrimary}>Démarrer</button>}
        {isRun   && <button onClick={pause}  style={btn}>Pause</button>}
        {isPause && <button onClick={resume} style={btnPrimary}>Reprendre</button>}
        {!isIdle && <button onClick={stop}   style={btnDanger}>Arrêter</button>}
      </footer>
    </main>
  );
}

/* ——— Styles lavande (inchangés) ——— */
const page: React.CSSProperties = {
  minHeight:'100dvh',
  background:'linear-gradient(180deg,#F6F7FE 0%, #EDE9FE 100%)',
  fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  color:'#1E1B4B',
  display:'grid',
  gridTemplateRows:'auto 1fr auto'
};
const hdr: React.CSSProperties = {
  display:'grid',
  gridTemplateColumns:'40px 1fr 40px',
  alignItems:'center',
  padding:'12px 16px'
};
const back: React.CSSProperties = { textDecoration:'none', color:'#6D28D9', fontSize:20 };
const muteBtn: React.CSSProperties = {
  justifySelf:'end',
  border:'none',
  background:'rgba(167,139,250,.15)',
  color:'#4C1D95',
  borderRadius:12,
  padding:'8px 10px',
  cursor:'pointer'
};
const scene: React.CSSProperties = { display:'grid', placeItems:'center', padding:'10px 0' };
const tube: React.CSSProperties = {
  position:'relative', width:'min(88px, 36vw)', height:'68vh', minHeight:420,
  borderRadius:44, border:'1px solid rgba(167,139,250,.25)',
  background:'linear-gradient(180deg, rgba(167,139,250,.25), rgba(139,92,246,.15))',
  boxShadow:'inset 0 0 12px rgba(0,0,0,.05)', overflow:'hidden'
};
const fill: React.CSSProperties = {
  position:'absolute', left:0, bottom:0, width:'100%', height:'100%',
  background:'linear-gradient(180deg, #C4B5FD 0%, #A78BFA 100%)',
  filter:'brightness(1.05)', transition:'transform 1s', willChange:'transform'
};
const bubble: React.CSSProperties = {
  position:'absolute', left:'50%', width:88, height:88, borderRadius:'50%',
  background:'radial-gradient(60% 60% at 30% 30%, #EDE9FE 0%, #C4B5FD 50%, #A78BFA 90%)',
  boxShadow:'0 8px 18px rgba(167,139,250,.35), inset 0 0 0 2px #DDD6FE',
  transform:'translate(-50%, 100%)', willChange:'transform'
};
const shine: React.CSSProperties = {
  position:'absolute', inset:'8% 18% 50% 18%',
  borderRadius:'50%',
  background:'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,0))',
  filter:'blur(1px)'
};
const caption: React.CSSProperties = { marginTop:18, fontSize:18, color:'#4C1D95', textShadow:'0 1px 6px rgba(255,255,255,.5)' };
const controls: React.CSSProperties = { display:'flex', gap:10, justifyContent:'center', padding:'12px 0 18px' };
const btn: React.CSSProperties = {
  padding:'10px 16px', borderRadius:14,
  border:'1px solid rgba(167,139,250,.4)',
  background:'rgba(167,139,250,.15)',
  color:'#4C1D95', cursor:'pointer', fontWeight:600
};
const btnPrimary: React.CSSProperties = {
  padding:'12px 18px', borderRadius:14,
  border:'1px solid #8B5CF6',
  background:'#A78BFA', color:'#fff', fontWeight:700, cursor:'pointer',
  boxShadow:'0 6px 16px rgba(167,139,250,.4)'
};
const btnDanger: React.CSSProperties = {
  padding:'10px 16px', borderRadius:14,
  border:'1px solid rgba(255,132,132,.35)',
  background:'rgba(255,80,80,.1)',
  color:'#B91C1C', cursor:'pointer'
};
const css = `
  @media (prefers-reduced-motion: reduce){
    *{ animation-duration:0.001ms!important; animation-iteration-count:1!important; transition-duration:0.001ms!important }
  }
`;
