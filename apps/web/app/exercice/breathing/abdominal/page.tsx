'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import PageHeaderActions from '../../../../components/PageHeaderActions';
import ExerciseCompletionPrompt from '../../../../components/ExerciseCompletionPrompt';
import { useQueryParam } from '../../../../hooks/useQueryParam';
import { logActivity } from '../../../../lib/patientTracking';

type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'completed';

const BREATHING_CONFIG = {
  inhaleDuration: 3000,
  holdDuration: 1000,
  exhaleDuration: 4000,
  totalCycles: 20,
} as const;

const ACTIVE_PHASES: Array<Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>> = [
  'inhale',
  'hold',
  'exhale',
];

const PHASE_COPY = {
  idle: {
    title: 'Appuie sur « Démarrer »',
    subtitle: 'Le cycle commencera par une inspiration de 3 secondes.',
  },
  inhale: {
    title: 'Inspire par le nez en laissant le ventre se gonfler',
    subtitle: '3 secondes',
  },
  hold: {
    title: 'Garde doucement l’air',
    subtitle: 'Pause • 1 seconde',
  },
  exhale: {
    title: 'Souffle par la bouche en rentrant doucement le ventre',
    subtitle: '4 secondes',
  },
  completed: {
    title: 'Exercice terminé',
    subtitle: 'Les 20 cycles sont terminés. Tu peux recommencer quand tu veux.',
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

function getPhaseDuration(phase: Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>) {
  if (phase === 'inhale') return BREATHING_CONFIG.inhaleDuration;
  if (phase === 'hold') return BREATHING_CONFIG.holdDuration;
  return BREATHING_CONFIG.exhaleDuration;
}

function getNextPhase(phase: Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>) {
  const currentIndex = ACTIVE_PHASES.indexOf(phase);
  return ACTIVE_PHASES[currentIndex + 1] ?? 'inhale';
}

export default function AbdominalBreathing() {
  const { backHref } = useOrigin();

  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BREATHING_CONFIG.inhaleDuration / 1000);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [completionOpen, setCompletionOpen] = useState(false);

  const rafRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);

  const isRunning = phase === 'inhale' || phase === 'hold' || phase === 'exhale';
  const statusCopy = PHASE_COPY[phase];
  const currentCycle = phase === 'completed' ? BREATHING_CONFIG.totalCycles : Math.min(completedCycles + 1, BREATHING_CONFIG.totalCycles);

  const barPercent = (() => {
    if (phase === 'inhale') return phaseProgress * 100;
    if (phase === 'hold') return 100;
    if (phase === 'exhale') return (1 - phaseProgress) * 100;
    return 0;
  })();

  const phaseGlyph = phase === 'inhale' ? '↑' : phase === 'hold' ? 'Ⅱ' : phase === 'exhale' ? '↓' : '';

  function cancelFrame() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function resetExercise(nextPhase: BreathingPhase = 'idle') {
    runTokenRef.current += 1;
    cancelFrame();
    setPhase(nextPhase);
    setPhaseProgress(0);
    setSecondsLeft(BREATHING_CONFIG.inhaleDuration / 1000);
    setCompletedCycles(0);
  }

  function startExercise() {
    runTokenRef.current += 1;
    cancelFrame();
    setCompletionOpen(false);
    setCompletedCycles(0);
    setPhaseProgress(0);
    setSecondsLeft(BREATHING_CONFIG.inhaleDuration / 1000);
    setPhase('inhale');
    vibe(12);
    void logActivity({
      category: 'BREATHING',
      subType: 'Respiration abdominale',
      detail: '3-1-4 / 20 cycles',
    }).catch(() => {});
  }

  function stopExercise() {
    setCompletionOpen(false);
    resetExercise('idle');
  }

  useEffect(() => {
    if (!isRunning) {
      cancelFrame();
      return;
    }

    const currentPhase = phase as Extract<BreathingPhase, 'inhale' | 'hold' | 'exhale'>;
    const duration = getPhaseDuration(currentPhase);
    const startedAt = performance.now();
    const runToken = runTokenRef.current;

    setSecondsLeft(Math.ceil(duration / 1000));
    if (currentPhase !== 'hold') {
      setPhaseProgress(0);
    }

    const tick = (now: number) => {
      if (runToken !== runTokenRef.current) return;

      const elapsed = Math.min(now - startedAt, duration);
      const progress = elapsed / duration;
      const remainingMs = Math.max(0, duration - elapsed);

      setPhaseProgress(progress);
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));

      if (elapsed >= duration) {
        vibe(currentPhase === 'hold' ? 6 : 8);

        if (currentPhase === 'exhale') {
          const nextCompletedCycles = completedCycles + 1;
          setCompletedCycles(nextCompletedCycles);

          if (nextCompletedCycles >= BREATHING_CONFIG.totalCycles) {
            cancelFrame();
            setPhase('completed');
            setPhaseProgress(0);
            setSecondsLeft(0);
            setCompletionOpen(true);
            return;
          }

          setPhase('inhale');
          setPhaseProgress(0);
          setSecondsLeft(BREATHING_CONFIG.inhaleDuration / 1000);
          return;
        }

        const nextPhase = getNextPhase(currentPhase);
        setPhase(nextPhase);
        setPhaseProgress(nextPhase === 'hold' ? 1 : 0);
        setSecondsLeft(Math.ceil(getPhaseDuration(nextPhase) / 1000));
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelFrame();
  }, [completedCycles, isRunning, phase]);

  useEffect(() => () => cancelFrame(), []);

  const countdownLabel = isRunning ? `${secondsLeft}` : statusCopy.subtitle;

  return (
    <main
      className="abdominal-page"
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
      <style>{css}</style>
      <header
        className="abdominal-header"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
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
            Cycle 3 - 1 - 4 (inspire, pause douce, expire). Inspire par le nez, gonfle le ventre
            (main du bas), garde doucement l’air, puis souffle par la bouche en rentrant
            doucement le ventre. Ta main sur la poitrine ne doit pas bouger : respire
            uniquement avec le ventre.
          </p>
        </div>
        <PageHeaderActions />
      </header>

      <section className="abdominal-instruction-wrap" style={instructionWrap} aria-live="polite">
        <p style={instructionTitle}>{statusCopy.title}</p>
        <p style={instructionMeta}>
          {isRunning ? `${countdownLabel} seconde${secondsLeft > 1 ? 's' : ''}` : countdownLabel}
        </p>
        <p style={cycleMeta}>
          Cycle {Math.max(0, currentCycle)} sur {BREATHING_CONFIG.totalCycles}
        </p>
      </section>

      <section style={sceneSection}>
        <div className="abdominal-scene-layout" style={sceneLayout}>
          <div className="abdominal-image-card" style={imageCard}>
            <Image src="/abdo/base.png" alt="" width={720} height={720} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          <div className="abdominal-meter-column" style={meterColumn} aria-hidden>
            <div className="abdominal-meter-rail" style={meterRail}>
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

      <section className="abdominal-controls-panel" style={controlsPanel}>
        <div className="abdominal-controls-row" style={controlsRow}>
          <button
            type="button"
            onClick={() => {
              if (isRunning) {
                stopExercise();
                return;
              }
              startExercise();
            }}
            style={primaryButton}
          >
            {isRunning ? 'Arrêter' : phase === 'completed' ? 'Recommencer' : 'Démarrer'}
          </button>

          <button type="button" onClick={() => resetExercise('idle')} style={secondaryButton}>
            Réinitialiser
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

const cycleMeta: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: 'rgba(32,16,63,0.64)',
  fontWeight: 700,
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

const css = `
  @media (max-width: 720px) {
    .abdominal-scene-layout{
      grid-template-columns: 1fr !important;
      justify-items: center;
      align-items: center !important;
    }

    .abdominal-meter-column{
      width: 100%;
      padding-bottom: 0 !important;
    }

    .abdominal-meter-rail{
      width: min(100%, 280px) !important;
      height: 220px !important;
    }
  }

  @media (max-width: 520px) {
    .abdominal-page{
      gap: 16px !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
    }

    .abdominal-header{
      padding: 0 4px !important;
    }

    .abdominal-instruction-wrap{
      width: 100% !important;
    }

    .abdominal-image-card{
      border-radius: 20px !important;
    }

    .abdominal-controls-panel{
      width: 100% !important;
    }

    .abdominal-controls-row{
      display: grid !important;
      grid-template-columns: 1fr !important;
    }

    .abdominal-controls-row button{
      width: 100%;
      min-width: 0 !important;
    }
  }
`;
