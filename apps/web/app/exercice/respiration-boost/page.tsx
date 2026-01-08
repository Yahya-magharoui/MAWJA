'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../components/BackLink';
import { useQueryParam } from '../../../hooks/useQueryParam';

type Phase = 'inhale' | 'hold' | 'exhale';

const INHALE_S = 4;
const HOLD_S   = 7;
const EXHALE_S = 8;
const CYCLES   = 4;

function useOrigin() {
  const fromParam = useQueryParam('from', 'hyper');
  const from = fromParam === 'hypo' ? 'hypo' : 'hyper';
  return { backHref: from === 'hyper' ? '/hyperactivation' : '/hypoactivation' };
}

function vibe(ms = 12) { try { (navigator as any)?.vibrate?.(ms); } catch {} }

export default function StimulatingBreathPage() {
  const { backHref } = useOrigin();

  // thème doux
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)`,
    []
  );

  // écran d’intro
  const [started, setStarted] = useState(false);

  // machine d’état respiration
  const [phase, setPhase] = useState<Phase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(INHALE_S);
  const [cycleIndex, setCycleIndex] = useState(0); // 0..CYCLES-1
  const [running, setRunning] = useState(false);
  const [loop, setLoop] = useState(false);
  const timerRef = useRef<number | null>(null);

  // passage de phase
  function advance() {
    if (phase === 'inhale') {
      setPhase('hold'); setSecondsLeft(HOLD_S); vibe();
    } else if (phase === 'hold') {
      setPhase('exhale'); setSecondsLeft(EXHALE_S); vibe();
    } else {
      // fin d’un cycle
      const next = cycleIndex + 1;
      if (next >= CYCLES && !loop) {
        setRunning(false);
        vibe(40);
        return;
      }
      setCycleIndex(next % CYCLES);
      setPhase('inhale'); setSecondsLeft(INHALE_S); vibe();
    }
  }

  // minuterie
  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          advance();
          return 0; // sera réinitialisé par advance()
        }
        return s - 1;
      });
    }, 1000);
    return () => { timerRef.current && clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, cycleIndex, loop]);

  // dimensions / style de la bulle selon la phase + progression
  const totalPhase =
    phase === 'inhale' ? INHALE_S :
    phase === 'hold'   ? HOLD_S   : EXHALE_S;

  const progress = 1 - secondsLeft / Math.max(1, totalPhase); // 0→1 dans la phase courante

  // taille: base 110 -> 220px (grandit en inspiration, rapetisse en expiration)
  const minSize = 110, maxSize = 220;
  const size =
    phase === 'inhale'
      ? minSize + (maxSize - minSize) * progress
      : phase === 'exhale'
      ? maxSize - (maxSize - minSize) * progress
      : maxSize; // hold

  const bubbleColor =
    phase === 'hold' ? '#C7D2FE' : '#E9D5FF'; // couleur différente au blocage

  // libellé au centre
  const centerText = phase === 'inhale' ? 'inspire'
                    : phase === 'hold'   ? 'bloque'
                    : 'expire';

  function startFromIntro() {
    setStarted(true);
    setRunning(true);
    setPhase('inhale');
    setSecondsLeft(INHALE_S);
    setCycleIndex(0);
    vibe(18);
  }

  function pauseResume() {
    setRunning(r => !r); vibe();
  }

  function restart() {
    setRunning(true);
    setPhase('inhale');
    setSecondsLeft(INHALE_S);
    setCycleIndex(0);
    vibe(22);
  }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' }}>
      <style>{css}</style>

      {/* Top bar */}
      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <BackLink href={backHref} style={{ justifySelf: 'start' }} />
        <h1 style={{ margin:0, fontSize:20 }}>Respiration stimulante</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button>
      </header>

      {/* INTRO */}
      {!started && (
        <section style={{ maxWidth:620, margin:'0 auto', padding:'8px 20px', display:'grid', gap:12 }}>

          <div style={chip}>Assis-toi dans un endroit confortable ou allonge-toi.</div>
          <div style={chip}>Mets la langue au repos, la pointe juste derrière les dents du haut contre le palais.</div>
          <div style={chip}>Appuie sur «&nbsp;Début&nbsp;» quand tu es prêt·e.</div>

          {/* bouton début */}
          <div style={{ display:'grid', justifyContent:'center', marginTop:12 }}>
            <button onClick={startFromIntro} style={primaryBtn}>Début</button>
          </div>
        </section>
      )}

      {/* EXERCICE */}
      {started && (
        <section style={{ display:'grid', placeItems:'center', padding:'6px 20px' }}>
          <div style={{ position:'relative', width:360, height:360, maxWidth:'min(80vw, 360px)' }}>
            {/* bulle */}
            <div
              style={{
                position:'absolute', left:'50%', top:'50%',
                transform:`translate(-50%,-50%)`,
                width:size, height:size, borderRadius:'50%',
                background:bubbleColor, boxShadow:'0 10px 24px rgba(0,0,0,.08), inset 0 0 0 6px rgba(0,0,0,.06)',
                display:'grid', placeItems:'center',
                transition: 'width .95s linear, height .95s linear, background-color .4s ease',
              }}
            >
              <div style={{ fontSize:12, fontWeight:700, opacity:.8 }}>{centerText}</div>
            </div>
          </div>

          {/* commandes */}
          <div style={{ display:'flex', gap:12, marginTop:12 }}>
            <button onClick={pauseResume} style={pillBtn}>{running ? 'Pause' : 'Reprendre'}</button>
            <button onClick={restart} style={pillBtn}>Relancer l’exercice</button>
            <button onClick={() => { setLoop(l => !l); vibe(); }} style={{ ...pillBtn, opacity: loop ? 1 : .8 }}>
              {loop ? 'Loop actif' : 'Loop (sans arrêt)'}
            </button>
          </div>

          <div style={{ marginTop:8, opacity:.7, fontSize:12 }}>
            Cycle {Math.min(cycleIndex+1, CYCLES)}/{CYCLES} •
            &nbsp;Temps phase: {String(secondsLeft).padStart(2,'0')}s
          </div>
        </section>
      )}
    </main>
  );
}

const gearBtn: React.CSSProperties = {
  border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer'
};

const chip: React.CSSProperties = {
  border:'1px solid rgba(0,0,0,.08)',
  background:'#EDE9FE',
  color:'#111',
  padding:'12px 14px',
  borderRadius:14,
  boxShadow:'0 8px 18px rgba(0,0,0,.05)',
  fontSize:13,
  lineHeight:1.25
};

const primaryBtn: React.CSSProperties = {
  padding:'12px 18px', borderRadius:14, border:'none', background:'var(--theme-color)', color:'#fff', fontWeight:800, cursor:'pointer',
  boxShadow:'0 10px 22px rgba(0,0,0,.10)'
};

const pillBtn: React.CSSProperties = {
  padding:'10px 14px', borderRadius:999, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontWeight:700
};

const css = `
  @media (hover:hover){ button:hover{ filter:brightness(.98) } }
`;
