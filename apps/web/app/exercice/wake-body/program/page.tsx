'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Step = { key: string; label: string; icon: string; seconds: number };

const STEPS: Step[] = [
  { key: 'walk',    icon: '/icons/walk.svg',    label: 'Marche pendant quelques instants si tu peux te lever', seconds: 60 },
  { key: 'armsUp',  icon: '/icons/arms-up.svg', label: 'Lève les bras au-dessus de la tête et redescends-les calmement', seconds: 60 },
  { key: 'sideBend',icon: '/icons/side-bend.svg',label: 'Étire-toi vers la gauche puis vers la droite', seconds: 60 },
  { key: 'squat',   icon: '/icons/squat.svg',   label: 'Fais des descentes comme si tu t’asseyais sur une chaise', seconds: 60 },
  { key: 'water',   icon: '/icons/water.svg',   label: 'Va te chercher un verre d’eau et inspire profondément', seconds: 60 },
];

function useChooserHref() {
  const sp = useSearchParams();
  const from = (sp.get('from') === 'hyper' ? 'hyper' : 'hypo') as 'hyper' | 'hypo';
  return `/exercice/wake-body?from=${from}`;
}

function vibe(ms = 15) {
  try { (navigator as any)?.vibrate?.(ms); } catch {}
}

export default function WakeProgram() {
  const chooserHref = useChooserHref();
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)`,
    []
  );

  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(STEPS[0].seconds);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const done = index >= STEPS.length;

  useEffect(() => {
    if (!running || done) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setLeft(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          nextStep();
        }
        return next;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, index, done]);

  function startPause() {
    if (done) return;
    setRunning(r => !r);
    vibe(10);
  }

  function nextStep() {
    const ni = index + 1;
    if (ni >= STEPS.length) {
      setRunning(false);
      setIndex(ni);
      vibe(40);
      return;
    }
    setIndex(ni);
    setLeft(STEPS[ni].seconds);
    vibe(10);
  }

  function resetAll() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setIndex(0);
    setLeft(STEPS[0].seconds);
    vibe(20);
  }

  const current = STEPS[index];
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const progress = Math.round((index / STEPS.length) * 100);
  const totalLeft = STEPS.slice(index).reduce(
    (acc, st, idx) => acc + (idx === 0 ? left : st.seconds),
    0
  );

  if (done) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          background: bg,
          fontFamily: "'Fredoka One', Inter, system-ui, sans-serif",
          color: '#0f172a',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h1 style={{ fontSize: 22 }}>Programme terminé</h1>
          <p style={{ opacity: 0.7 }}>Bravo ! Tu as réveillé ton corps en douceur.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
            <button onClick={resetAll} style={btnPrimary}>Refaire</button>
            <a href={chooserHref} style={btnGhost}>Retour</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: bg,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
      }}
    >

      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          padding: '16px 20px',
        }}
      >
        <a href={chooserHref} style={{ textDecoration: 'none', color: '#111', fontSize: 20 }}>←</a>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Programme complet</h1>
        <div />
      </header>

      <div style={{ maxWidth: 560, margin: '8px auto 0', padding: '0 20px' }}>
        <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--theme-color)' }} />
        </div>

        <article style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={icon}>
              <img src={current.icon} alt={current.label} width={40} height={40} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{current.label}</div>
              <div style={{ opacity: 0.7, fontSize: 13 }}>
                Étape {index + 1}/{STEPS.length}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 40, margin: '8px 0 10px' }}>
            {mm}:{ss}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={startPause} style={btnPrimary}>
              {running ? 'Pause' : 'Démarrer'}
            </button>
            <button onClick={nextStep} style={btnGhost}>Suivant</button>
            <button onClick={resetAll} style={btnGhost}>Réinitialiser</button>
          </div>

          <div
            style={{
              opacity: 0.7,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            Reste total ~{' '}
            {String(Math.floor(totalLeft / 60)).padStart(2, '0')}:
            {String(totalLeft % 60).padStart(2, '0')}
          </div>
        </article>
      </div>

      <div style={{ height: 40 }} />
    </main>
  );
}

/* --- Styles --- */
const card: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,.06)',
  borderRadius: 18,
  padding: 14,
  background: '#fff',
  boxShadow: '0 8px 18px rgba(0,0,0,.06)',
};

const icon: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(var(--theme-color-rgb),0.2)',
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--theme-color)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
};
