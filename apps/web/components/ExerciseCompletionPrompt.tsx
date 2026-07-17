'use client';

import { useEffect, useMemo, useState } from 'react';
import { activationValueToRoute, classifyActivationValue } from '../lib/activationFlow';
import { postHistoryEntry } from '../lib/patientTracking';

type Props = {
  message?: string;
  onClose?: () => void;
  open: boolean;
};

export default function ExerciseCompletionPrompt({
  open,
  onClose,
  message = 'Merci d’avoir pris le temps de faire cet exercice.',
}: Props) {
  const [value, setValue] = useState(50);
  const [step, setStep] = useState<'gradient' | 'after'>('gradient');
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(50);
    setStep('gradient');
    setBusy(false);
    setRedirecting(false);
  }, [open]);

  const sparkles = useMemo(
    () => [
      { id: 'c1', top: 18, left: 28, size: 12, color: '#ec4899', delay: '0s', duration: '3.1s' },
      { id: 'c2', top: 42, left: 80, size: 10, color: '#3b82f6', delay: '.25s', duration: '3.4s' },
      { id: 'c3', top: 84, left: 22, size: 9, color: '#f59e0b', delay: '.6s', duration: '2.8s' },
      { id: 'c4', top: 26, right: 58, size: 11, color: '#10b981', delay: '.4s', duration: '3.2s' },
      { id: 'c5', top: 92, right: 28, size: 13, color: '#8b5cf6', delay: '.75s', duration: '3.5s' },
    ],
    []
  );

  async function validate() {
    if (busy || redirecting) return;
    setBusy(true);
    try {
      await postHistoryEntry(classifyActivationValue(value));
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
      setStep('after');
    }
  }

  function go(href: string) {
    if (redirecting) return;
    setRedirecting(true);
    window.location.href = href;
  }

  if (!open) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="exercise-completion-title">
      <style>{css}</style>
      <div style={styles.card}>
        <div style={styles.glow} aria-hidden="true" />
        <div style={styles.sparklesLayer} aria-hidden="true">
          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              className="exercise-completion-sparkle"
              style={{
                position: 'absolute',
                top: sparkle.top,
                left: 'left' in sparkle ? sparkle.left : undefined,
                right: 'right' in sparkle ? sparkle.right : undefined,
                width: sparkle.size,
                height: sparkle.size,
                color: sparkle.color,
                animationDelay: sparkle.delay,
                animationDuration: sparkle.duration,
              }}
            />
          ))}
        </div>

        {onClose ? (
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            disabled={busy || redirecting}
            style={styles.closeBtn}
          >
            ✕
          </button>
        ) : null}

        <div className="exercise-completion-pulse" style={styles.badgeWrap} aria-hidden="true">
          <div style={styles.badgeRing} />
          <div style={styles.badgeDot} />
        </div>

        <p style={styles.eyebrow}>Fin d’exercice</p>
        <h2 id="exercise-completion-title" style={styles.title}>Merci</h2>
        <p style={styles.text}>{message}</p>

        {step === 'gradient' ? (
          <>
            <p style={styles.textSecondary}>
              Déplace le curseur pour actualiser ton niveau d’activation actuel, puis valide pour poursuivre.
            </p>

            <div style={styles.sliderWrap}>
              <input
                aria-label="Niveau d’activation"
                type="range"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(event) => setValue(Number(event.currentTarget.value))}
                style={sliderStyle}
              />
              <div style={styles.sliderLabels}>
                <span style={styles.sliderEdge}>Hypoactivation</span>
                <span style={styles.sliderCenter}>Fenêtre de tolérance</span>
                <span style={styles.sliderEdge}>Hyperactivation</span>
              </div>
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => go('/app')} style={styles.secondaryBtn}>
                {redirecting ? 'Redirection…' : 'Arrêter pour le moment'}
              </button>
              <button
                type="button"
                onClick={() => void validate()}
                disabled={busy || redirecting}
                style={styles.primaryBtn}
              >
                {busy ? 'Enregistrement…' : 'Valider mon niveau d’activation'}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.actionsColumn}>
            <p style={styles.textSecondary}>Merci d’avoir actualisé ton état.</p>
            <button
              type="button"
              onClick={() => go(activationValueToRoute(value))}
              disabled={redirecting}
              style={styles.primaryBtn}
            >
              {redirecting ? 'Redirection…' : 'Continuer vers les exercices correspondants'}
            </button>
            <button
              type="button"
              onClick={() => go('/app')}
              disabled={redirecting}
              style={styles.secondaryBtn}
            >
              {redirecting ? 'Redirection…' : 'Arrêter pour le moment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.34)',
    backdropFilter: 'blur(6px)',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    zIndex: 1200,
  },
  card: {
    width: 'min(100%, 560px)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    borderRadius: 28,
    border: '1px solid rgba(148,163,184,0.22)',
    boxShadow: '0 30px 70px rgba(15,23,42,0.2)',
    padding: '26px 22px 22px',
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gap: 16,
  },
  glow: {
    position: 'absolute',
    inset: 'auto -10% 72% auto',
    width: 220,
    height: 220,
    background: 'radial-gradient(circle, rgba(196,181,253,0.55) 0%, rgba(196,181,253,0) 70%)',
    pointerEvents: 'none',
  },
  sparklesLayer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 12,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 18,
    color: '#64748b',
    zIndex: 2,
  },
  badgeWrap: {
    width: 82,
    height: 82,
    margin: '0 auto 4px',
    position: 'relative',
    zIndex: 2,
  },
  badgeRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #ede9fe 0%, #c4b5fd 48%, #a78bfa 100%)',
    opacity: 0.9,
  },
  badgeDot: {
    position: 'absolute',
    inset: 18,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 8px 22px rgba(167,139,250,0.28)',
  },
  eyebrow: {
    margin: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7c3aed',
    zIndex: 2,
  },
  title: {
    margin: 0,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 1.15,
    color: '#0f172a',
    zIndex: 2,
  },
  text: {
    margin: 0,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 1.55,
    color: '#334155',
    zIndex: 2,
  },
  textSecondary: {
    margin: 0,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 1.5,
    color: '#475569',
    zIndex: 2,
  },
  sliderWrap: {
    display: 'grid',
    gap: 16,
    padding: '6px 4px 2px',
    zIndex: 2,
  },
  sliderLabels: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 8,
    alignItems: 'start',
  },
  sliderEdge: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  },
  sliderCenter: {
    fontSize: 14,
    fontWeight: 800,
    color: '#312e81',
    textAlign: 'center',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: 12,
    zIndex: 2,
  },
  actionsColumn: {
    display: 'grid',
    gap: 12,
    zIndex: 2,
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 18,
    padding: '15px 18px',
    background: 'linear-gradient(180deg, #ddd6fe 0%, #c4b5fd 100%)',
    color: '#312e81',
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 14px 26px rgba(167,139,250,0.22)',
  },
  secondaryBtn: {
    border: '1px solid rgba(148,163,184,0.28)',
    borderRadius: 18,
    padding: '15px 18px',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
};

const sliderStyle: React.CSSProperties = {
  WebkitAppearance: 'none',
  appearance: 'none',
  width: '100%',
  height: 18,
  borderRadius: 999,
  outline: 'none',
  background: 'linear-gradient(90deg, #e9d5ff 0%, #f5d0fe 26%, #c4b5fd 50%, #d8b4fe 74%, #a855f7 100%)',
  boxShadow: 'inset 0 0 0 1px rgba(167,139,250,0.14)',
};

const css = `
  .exercise-completion-pulse {
    animation: exerciseCompletionFloat 2.8s ease-in-out infinite;
  }

  .exercise-completion-sparkle {
    display: block;
    opacity: 0;
    transform: translateY(8px) scale(.7) rotate(0deg);
    animation-name: exerciseCompletionSparkle;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    filter: drop-shadow(0 6px 12px rgba(255,255,255,.65));
  }

  .exercise-completion-sparkle::before,
  .exercise-completion-sparkle::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: currentColor;
  }

  .exercise-completion-sparkle::before {
    transform: rotate(45deg) scaleX(.3);
  }

  .exercise-completion-sparkle::after {
    transform: rotate(45deg) scaleY(.3);
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    border: 4px solid #a78bfa;
    box-shadow: 0 10px 22px rgba(167,139,250,0.3);
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffffff;
    border: 4px solid #a78bfa;
    box-shadow: 0 10px 22px rgba(167,139,250,0.3);
    cursor: pointer;
  }

  @media (max-width: 640px) {
    input[type="range"] { -webkit-tap-highlight-color: transparent; }
  }

  @keyframes exerciseCompletionFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.03); }
  }

  @keyframes exerciseCompletionSparkle {
    0%, 100% { opacity: 0; transform: translateY(8px) scale(.7) rotate(0deg); }
    20% { opacity: .95; transform: translateY(0) scale(1) rotate(20deg); }
    60% { opacity: .55; transform: translateY(-7px) scale(1.08) rotate(90deg); }
    80% { opacity: 0; transform: translateY(-12px) scale(.85) rotate(140deg); }
  }
`;
