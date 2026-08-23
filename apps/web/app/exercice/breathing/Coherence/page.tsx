'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import ExerciseCompletionPrompt from '../../../../components/ExerciseCompletionPrompt';
import { logActivity } from '../../../../lib/patientTracking';

type Phase = 'idle' | 'preparing' | 'inspire' | 'expire' | 'paused' | 'completed';
type ActivePhase = Extract<Phase, 'inspire' | 'expire'>;

const PROTO = { inhaleSec: 5, exhaleSec: 5, sessionMin: 5 };
const CYCLES_PER_MIN = 60 / (PROTO.inhaleSec + PROTO.exhaleSec);
const TARGET_CYCLES = Math.round(PROTO.sessionMin * CYCLES_PER_MIN);

const EDGE_PADDING = 6;

function vibe(ms = 12) {
  try {
    (navigator as Navigator & { vibrate?: (duration: number) => void })?.vibrate?.(ms);
  } catch {}
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getPhaseDuration(phase: ActivePhase) {
  return (phase === 'inspire' ? PROTO.inhaleSec : PROTO.exhaleSec) * 1000;
}

export default function BreathingTube() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [cycle, setCycle] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showTip, setTip] = useState(true);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [trackHeight, setTrackHeight] = useState(320);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTokenRef = useRef(0);
  const phaseStartRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const pausedPhaseRef = useRef<ActivePhase>('inspire');
  const activePhaseRef = useRef<ActivePhase>('inspire');
  const audioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const bubbleSize = useMemo(
    () => Math.max(48, Math.min(88, trackHeight * 0.18)),
    [trackHeight]
  );

  const topPosition = EDGE_PADDING;
  const bottomPosition = Math.max(EDGE_PADDING, trackHeight - bubbleSize - EDGE_PADDING);
  const travelDistance = Math.max(0, bottomPosition - topPosition);

  const phaseForVisual: ActivePhase =
    phase === 'paused' ? pausedPhaseRef.current : activePhaseRef.current;

  const logicalBubbleProgress =
    phaseForVisual === 'inspire' ? phaseProgress : 1 - phaseProgress;
  const safeProgress = clamp(logicalBubbleProgress);
  const bubbleTop = bottomPosition - safeProgress * (bottomPosition - topPosition);
  const bubbleCenter = bubbleTop + bubbleSize / 2;
  const fillHeight = Math.max(0, Math.min(trackHeight, trackHeight - bubbleCenter));

  const isIdle = phase === 'idle';
  const isPreparing = phase === 'preparing';
  const isRun = phase === 'inspire' || phase === 'expire';
  const isPause = phase === 'paused';

  const currentCycleLabel =
    phase === 'completed' ? TARGET_CYCLES : Math.min(cycle + 1, TARGET_CYCLES);

  function cancelFrame() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  const chime = useCallback((phaseName: ActivePhase) => {
    if (muted) return;
    try {
      if (!audioRef.current) {
        const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audioRef.current = new Ctx();
        gainRef.current = audioRef.current.createGain();
        gainRef.current.gain.value = 0.18;
        gainRef.current.connect(audioRef.current.destination);
      }

      const ctx = audioRef.current!;
      const bus = gainRef.current!;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = phaseName === 'inspire' ? 540 : 420;
      env.gain.value = 0.0001;

      osc.connect(env);
      env.connect(bus);

      const startAt = ctx.currentTime;
      osc.start(startAt);
      env.gain.exponentialRampToValueAtTime(0.16, startAt + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
      osc.stop(startAt + 0.32);
    } catch {}
  }, [muted]);

  const launchPhase = useCallback((nextPhase: ActivePhase, initialElapsed = 0) => {
    activePhaseRef.current = nextPhase;
    pausedPhaseRef.current = nextPhase;
    pausedElapsedRef.current = initialElapsed;
    phaseStartRef.current = performance.now() - initialElapsed;
    setPhaseProgress(clamp(initialElapsed / getPhaseDuration(nextPhase)));
    setPhase(nextPhase);
    chime(nextPhase);
    vibe(8);
  }, [chime]);

  useEffect(() => {
    if (!trackRef.current) return;

    const node = trackRef.current;
    const updateHeight = () => {
      setTrackHeight(node.getBoundingClientRect().height || 320);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isRun) {
      cancelFrame();
      return;
    }

    const phaseName = phase;
    const duration = getPhaseDuration(phaseName);
    const token = startTokenRef.current;

    const tick = (now: number) => {
      if (token !== startTokenRef.current) return;

      const elapsed = now - phaseStartRef.current;
      const nextProgress = clamp(elapsed / duration);
      setPhaseProgress(nextProgress);

      if (nextProgress >= 1) {
        if (phaseName === 'inspire') {
          launchPhase('expire');
          return;
        }

        const nextCycle = cycle + 1;
        setCycle(nextCycle);

        if (nextCycle >= TARGET_CYCLES) {
          cancelFrame();
          setPhaseProgress(0);
          setPhase('completed');
          setCompletionOpen(true);
          return;
        }

        launchPhase('inspire');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelFrame();
  }, [cycle, isRun, launchPhase, phase]);

  useEffect(() => {
    return () => {
      startTokenRef.current += 1;
      cancelFrame();
    };
  }, []);

  function start() {
    startTokenRef.current += 1;
    cancelFrame();
    setCycle(0);
    setPhaseProgress(0);
    setCompletionOpen(false);
    setTip(false);
    activePhaseRef.current = 'inspire';
    pausedPhaseRef.current = 'inspire';
    pausedElapsedRef.current = 0;
    setPhase('preparing');

    const token = startTokenRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== startTokenRef.current) return;
        launchPhase('inspire', 0);
      });
    });

    void logActivity({
      category: 'BREATHING',
      subType: 'Cohérence cardiaque',
      detail: '365 / 5 min',
    }).catch(() => {});
  }

  function pause() {
    if (!isRun) return;
    startTokenRef.current += 1;
    cancelFrame();
    pausedPhaseRef.current = phase;
    activePhaseRef.current = phase;
    pausedElapsedRef.current = phaseProgress * getPhaseDuration(phase);
    setPhase('paused');
  }

  function resume() {
    if (!isPause) return;
    startTokenRef.current += 1;
    cancelFrame();
    launchPhase(pausedPhaseRef.current, pausedElapsedRef.current);
  }

  function stop() {
    startTokenRef.current += 1;
    cancelFrame();
    setPhase('idle');
    setCycle(0);
    setPhaseProgress(0);
    setCompletionOpen(false);
    setTip(true);
    activePhaseRef.current = 'inspire';
    pausedPhaseRef.current = 'inspire';
    pausedElapsedRef.current = 0;
  }

  return (
    <main style={page} className="coherence-page">
      <style>{css}</style>
      <header style={hdr}>
        <BackLink href="/hyperactivation" style={back} />
        <h1 style={{ margin: 0, fontSize: 18, color: '#4B5563' }}>Cohérence cardiaque</h1>
        <button
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
          title={muted ? 'Activer le son' : 'Couper le son'}
          onClick={() => setMuted((value) => !value)}
          style={muteBtn}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <section style={scene} className="coherence-scene">
        <div ref={trackRef} style={tube} className="coherence-tube">
          <div
            style={{
              ...fill,
              height: `${fillHeight}px`,
            }}
          />
          <div
            style={{
              ...bubble,
              width: bubbleSize,
              height: bubbleSize,
              top: `${bubbleTop}px`,
            }}
          >
            <div style={shine} />
          </div>
        </div>

        <div style={caption}>
          {isIdle && <span>Appuie sur « Démarrer »</span>}
          {isPreparing && <span>Inspirez…</span>}
          {phase === 'inspire' && <span>Inspirez…</span>}
          {phase === 'expire' && <span>Expirez…</span>}
          {isPause && <span>En pause</span>}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, color: '#6B7280', marginTop: 6 }}>
          365 • {PROTO.sessionMin} min • 6 cycles/min — Cycle {currentCycleLabel} / {TARGET_CYCLES}
        </div>
      </section>

      <footer style={controls} className="coherence-controls">
        {isIdle && <button onClick={start} style={btnPrimary}>Démarrer</button>}
        {isPreparing && <button onClick={stop} style={btnDanger}>Arrêter</button>}
        {isRun && <button onClick={pause} style={btn}>Pause</button>}
        {isPause && <button onClick={resume} style={btnPrimary}>Reprendre</button>}
        {!isIdle && !isPreparing && <button onClick={stop} style={btnDanger}>Arrêter</button>}
      </footer>

      <section style={protocolCard} className="coherence-protocol-card">
        <div style={protocolTitle}>Protocole 3-6-5</div>
        <ul style={protocolList}>
          <li>3 fois par jour</li>
          <li>6 respirations par minute</li>
          <li>pendant 5 minutes</li>
        </ul>
      </section>

      <ExerciseCompletionPrompt
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        message="Merci d’avoir pris le temps de terminer cette séance de cohérence cardiaque."
      />
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  background: 'linear-gradient(180deg,#F6F7FE 0%, #EDE9FE 100%)',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  color: '#1E1B4B',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
};

const hdr: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 1fr 40px',
  alignItems: 'center',
  padding: '12px 16px',
};

const back: React.CSSProperties = { justifySelf: 'start', color: '#6D28D9' };

const muteBtn: React.CSSProperties = {
  justifySelf: 'end',
  border: 'none',
  background: 'rgba(167,139,250,.15)',
  color: '#4C1D95',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

const scene: React.CSSProperties = { display: 'grid', placeItems: 'center', padding: '10px 0' };

const tube: React.CSSProperties = {
  position: 'relative',
  width: 'min(88px, 36vw)',
  height: 'min(60vh, 540px)',
  minHeight: 320,
  borderRadius: 44,
  border: '1px solid rgba(167,139,250,.25)',
  background: 'linear-gradient(180deg, rgba(167,139,250,.25), rgba(139,92,246,.15))',
  boxShadow: 'inset 0 0 12px rgba(0,0,0,.05)',
  overflow: 'hidden',
};

const fill: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  minHeight: 0,
  background: 'linear-gradient(180deg, #C4B5FD 0%, var(--theme-color) 100%)',
  filter: 'brightness(1.05)',
  willChange: 'height',
};

const bubble: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  borderRadius: '999px',
  background: 'radial-gradient(60% 60% at 30% 30%, #EDE9FE 0%, #C4B5FD 50%, var(--theme-color) 90%)',
  boxShadow: '0 8px 18px rgba(167,139,250,.35), inset 0 0 0 2px #DDD6FE',
  transform: 'translateX(-50%)',
  willChange: 'top',
};

const shine: React.CSSProperties = {
  position: 'absolute',
  inset: '8% 18% 50% 18%',
  borderRadius: '50%',
  background: 'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,0))',
  filter: 'blur(1px)',
};

const caption: React.CSSProperties = {
  marginTop: 18,
  fontSize: 18,
  color: '#4C1D95',
  textShadow: '0 1px 6px rgba(255,255,255,.5)',
};

const controls: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
  padding: '8px 0 12px',
  flexWrap: 'wrap',
};

const protocolCard: React.CSSProperties = {
  margin: '0 auto 20px',
  width: 'min(520px, calc(100% - 32px))',
  padding: '12px 16px',
  borderRadius: 16,
  border: '1px solid rgba(167,139,250,.28)',
  background: 'rgba(255,255,255,.72)',
  boxShadow: '0 10px 24px rgba(167,139,250,.12)',
  color: '#4C1D95',
};

const protocolTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  marginBottom: 8,
  textAlign: 'center',
};

const protocolList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 4,
};

const btnBase: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 16,
  border: '1px solid transparent',
  fontWeight: 800,
  cursor: 'pointer',
  minWidth: 140,
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)',
  color: '#fff',
  boxShadow: '0 12px 24px rgba(139,92,246,.28)',
};

const btn: React.CSSProperties = {
  ...btnBase,
  background: '#fff',
  color: '#20103F',
  borderColor: 'rgba(15,23,42,.08)',
  boxShadow: '0 8px 18px rgba(15,23,42,.06)',
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: '#fff',
  color: '#DC2626',
  borderColor: 'rgba(220,38,38,.24)',
  boxShadow: '0 8px 18px rgba(15,23,42,.06)',
};

const css = `
  @media (max-width: 640px) {
    .coherence-page {
      overflow-x: clip;
    }

    .coherence-scene {
      padding: 4px 12px 0 !important;
      gap: 18px !important;
    }

    .coherence-tube {
      width: min(84px, 28vw) !important;
      height: min(50vh, 420px) !important;
      min-height: 260px !important;
    }

    .coherence-controls {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }

    .coherence-controls button {
      width: min(100%, 320px);
      min-width: 0 !important;
    }

    .coherence-protocol-card {
      width: calc(100% - 24px) !important;
      margin-bottom: 16px !important;
    }
  }
`;
