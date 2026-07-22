'use client';

import { useEffect, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import ExerciseCompletionPrompt from '../../../../components/ExerciseCompletionPrompt';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import { logActivity } from '../../../../lib/patientTracking';

type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'completed';

const PHASE_SEQUENCE: Array<Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>> = [
  'inhale',
  'hold',
  'exhale',
];

const PHASE_DURATION: Record<Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>, number> = {
  inhale: 6,
  hold: 4,
  exhale: 6,
};

const PHASE_COPY = {
  idle: {
    title: 'Appuie sur « Démarrer »',
    subtitle: 'Le cycle commencera par une inspiration de 6 secondes.',
  },
  inhale: {
    title: 'Inspire par le nez en laissant le ventre se gonfler',
    subtitle: '6 secondes',
  },
  hold: {
    title: 'Bloque ta respiration',
    subtitle: '4 secondes',
  },
  exhale: {
    title: 'Souffle par la bouche en rentrant doucement le ventre',
    subtitle: '6 secondes',
  },
  completed: {
    title: 'Cycle terminé',
    subtitle: 'Tu peux recommencer ou activer la boucle.',
  },
} as const;

function useOrigin() {
  const param = useQueryParam('from', 'app');
  const from = (param === 'hyper' ? 'hyper' : 'app') as 'hyper' | 'app';
  return { backHref: from === 'hyper' ? '/hyperactivation/breathing' : '/app' };
}

function vibe(ms = 10) {
  try {
    (navigator as Navigator & { vibrate?: (duration: number) => void })?.vibrate?.(ms);
  } catch {}
}

function getNextPhase(phase: Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>) {
  const index = PHASE_SEQUENCE.indexOf(phase);
  return PHASE_SEQUENCE[(index + 1) % PHASE_SEQUENCE.length];
}

export default function AbdominalBreathing() {
  const { backHref } = useOrigin();

  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(PHASE_DURATION.inhale);
  const [progress, setProgress] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  const rafRef = useRef<number | null>(null);
  const phaseStartRef = useRef(0);

  const isRunning = phase === 'inhale' || phase === 'hold' || phase === 'exhale';
  const statusCopy = PHASE_COPY[phase];

  const barPercent = (() => {
    if (phase === 'inhale') return progress * 100;
    if (phase === 'hold') return 100;
    if (phase === 'exhale') return (1 - progress) * 100;
    return 0;
  })();

  const phaseGlyph = phase === 'inhale' ? '↑' : phase === 'hold' ? 'Ⅱ' : phase === 'exhale' ? '↓' : '';

  function cancelFrame() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function resetCycle(nextPhase: BreathingPhase = 'idle') {
    cancelFrame();
    setPhase(nextPhase);
    setProgress(0);
    setSecondsLeft(PHASE_DURATION.inhale);
  }

  function startCycle() {
    cancelFrame();
    setCompletionOpen(false);
    setPhase('inhale');
    setProgress(0);
    setSecondsLeft(PHASE_DURATION.inhale);
    phaseStartRef.current = 0;
    vibe(10);
    void logActivity({
      category: 'BREATHING',
      subType: 'Respiration abdominale',
      detail: '6-4-6',
    }).catch(console.error);
  }

  function stopCycle() {
    setCompletionOpen(false);
    resetCycle('idle');
  }

  useEffect(() => {
    if (!isRunning) {
      cancelFrame();
      return;
    }

    const currentPhase = phase;
    const duration = PHASE_DURATION[currentPhase];

    phaseStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min((now - phaseStartRef.current) / 1000, duration);
      const nextProgress = duration === 0 ? 1 : elapsed / duration;
      const remaining = Math.max(1, Math.ceil(duration - elapsed));

      setProgress(nextProgress);
      setSecondsLeft(elapsed >= duration ? 1 : remaining);

      if (elapsed >= duration) {
        vibe(6);

        if (currentPhase === 'exhale') {
          if (loopEnabled) {
            setPhase('inhale');
            setProgress(0);
            setSecondsLeft(PHASE_DURATION.inhale);
          } else {
            setPhase('completed');
            setProgress(0);
            setSecondsLeft(PHASE_DURATION.inhale);
            setCompletionOpen(true);
          }
          return;
        }

        const nextPhase = getNextPhase(currentPhase);
        setPhase(nextPhase);
        setProgress(0);
        setSecondsLeft(PHASE_DURATION[nextPhase]);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelFrame();
    };
  }, [isRunning, loopEnabled, phase]);

  useEffect(() => {
    return () => {
      cancelFrame();
    };
  }, []);

  const countdownLabel = isRunning ? `${secondsLeft}` : statusCopy.subtitle;

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)',
        fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
        color: '#0f172a',
        padding: '16px 12px 32px',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr auto',
        justifyItems: 'center',
        gap: 20,
      }}
    >
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'start',
          width: '100%',
          gap: 8,
          justifySelf: 'stretch',
          padding: '0 8px',
        }}
      >
        <BackLink href={backHref} style={{ justifySelf: 'start' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 18, textAlign: 'left' }}>Respiration abdominale</h1>
          <p style={{ margin: '2px 0 0', opacity: 0.72, fontSize: 12, textAlign: 'left' }}>
            Cycle 6 - 4 - 6 (inspire, bloque, expire). Inspire par le nez, gonfle le ventre
            (main du bas), bloque quelques instants, puis souffle par la bouche en rentrant
            doucement le ventre. Ta main sur la poitrine ne doit pas bouger : respire
            uniquement avec le ventre.
          </p>
        </div>
      </header>

      <section style={instructionWrap} aria-live="polite">
        <p style={instructionTitle}>{statusCopy.title}</p>
        <p style={instructionMeta}>
          {isRunning ? `${countdownLabel} seconde${secondsLeft > 1 ? 's' : ''}` : countdownLabel}
        </p>
      </section>

      <section style={sceneSection}>
        <div style={sceneLayout}>
          <div style={imageCard}>
            <img src="/abdo/base.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          <div style={meterColumn} aria-hidden>
            <div style={meterRail}>
              <div style={meterGlow} />
              <div
                style={{
                  ...meterFill,
                  height: `${Math.max(0, Math.min(100, barPercent))}%`,
                }}
              >
                {isRunning ? <span style={meterGlyph}>{phaseGlyph}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={controlsPanel}>
        <div style={controlsRow}>
          <button
            type="button"
            onClick={() => {
              if (isRunning) {
                stopCycle();
                return;
              }
              startCycle();
            }}
            style={primaryButton}
          >
            {isRunning ? 'Arrêter' : 'Démarrer'}
          </button>

          <button
            type="button"
            aria-pressed={loopEnabled}
            onClick={() => setLoopEnabled((value) => !value)}
            style={{
              ...secondaryButton,
              background: loopEnabled ? 'rgba(var(--theme-color-rgb), 0.14)' : '#fff',
              borderColor: loopEnabled ? 'rgba(var(--theme-color-rgb), 0.38)' : 'rgba(15,23,42,0.08)',
            }}
          >
            {loopEnabled ? 'Loop activé' : 'Loop'}
          </button>
        </div>
      </section>

      <ExerciseCompletionPrompt
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        message="Merci d’avoir pris le temps de terminer cet exercice de respiration abdominale."
      />
    </main>
  );
}

const instructionWrap: React.CSSProperties = {
  width: 'min(720px, 94vw)',
  display: 'grid',
  justifyItems: 'center',
  textAlign: 'center',
  gap: 6,
};

const instructionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(20px, 3vw, 32px)',
  fontWeight: 800,
  lineHeight: 1.15,
  color: '#20103F',
};

const instructionMeta: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(14px, 2vw, 18px)',
  color: 'rgba(32,16,63,0.72)',
  fontWeight: 600,
};

const sceneSection: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  placeItems: 'center',
};

const sceneLayout: React.CSSProperties = {
  width: 'min(680px, 96vw)',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  justifyContent: 'center',
  gap: 'clamp(16px, 4vw, 28px)',
};

const imageCard: React.CSSProperties = {
  width: 'min(100%, 460px)',
  borderRadius: 28,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(15,23,42,0.04)',
};

const meterColumn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'end center',
  height: '100%',
  paddingBottom: 10,
};

const meterRail: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: 'clamp(55px, 12vw, 90px)',
  height: 'clamp(220px, 43vh, 360px)',
  borderRadius: 26,
  border: '3px solid rgba(185, 155, 255, 0.72)',
  background: 'linear-gradient(180deg, rgba(229,220,255,0.88) 0%, rgba(216,201,255,0.72) 100%)',
  boxShadow: '0 0 0 8px rgba(173,143,247,0.12), inset 0 0 0 1px rgba(255,255,255,0.55)',
};

const meterGlow: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 35%)',
  pointerEvents: 'none',
};

const meterFill: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  minHeight: 0,
  borderRadius: '20px 20px 22px 22px',
  background: 'linear-gradient(180deg, #C084FC 0%, #8B5CF6 100%)',
  boxShadow: '0 10px 18px rgba(139,92,246,0.24)',
  display: 'grid',
  placeItems: 'center',
};

const meterGlyph: React.CSSProperties = {
  color: '#fff',
  fontSize: 30,
  fontWeight: 800,
  lineHeight: 1,
  textShadow: '0 2px 10px rgba(0,0,0,0.12)',
};

const controlsPanel: React.CSSProperties = {
  width: 'min(520px, 94vw)',
  borderRadius: 24,
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(15,23,42,0.05)',
  boxShadow: '0 14px 32px rgba(15,23,42,0.08)',
  padding: '18px 16px',
};

const controlsRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 12,
};

const buttonBase: React.CSSProperties = {
  minWidth: 148,
  minHeight: 52,
  padding: '12px 18px',
  borderRadius: 16,
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
};

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  border: '1px solid #8B5CF6',
  background: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)',
  color: '#fff',
  boxShadow: '0 12px 24px rgba(139,92,246,0.28)',
};

const secondaryButton: React.CSSProperties = {
  ...buttonBase,
  border: '1px solid rgba(15,23,42,0.08)',
  background: '#fff',
  color: '#20103F',
  boxShadow: '0 8px 18px rgba(15,23,42,0.06)',
};
