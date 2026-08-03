'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { logActivity } from '../../../../lib/patientTracking';

type SafePlace = {
  id: string;
  name: string;
  answers: string[];
  createdAt: number;
};

const SAFE_PLACE_STEPS = [
  'Pense à un lieu réel ou imaginaire où tu as été et où tu t’es senti en sécurité.',
  'Peux-tu le visualiser ?',
  'Promène-toi visuellement dans ton lieu sûr.',
  'Est-ce qu’une image pourrait représenter cet endroit ?',
  'Essaie de décrire ce que tu vois.',
  'Note ce que tu entends, ce que tu ressens et ce que tu penses dans cet endroit sécurisant.',
  'Concentre-toi sur tout cela et essaie de situer où tu ressens cela dans ton corps.',
  'Est-ce qu’un mot ou une expression pourrait représenter cet endroit sécurisant ?',
  'Pense à ce mot ou à cette expression et note les sensations que tu ressens quand tu y penses.',
  'Maintenant, tu peux effectuer cet exercice aussi souvent que nécessaire.',
] as const;

const TEXT_INPUT_MAX_LENGTH = 48;
const STORAGE_KEY = 'safePlaceBuildDraftV2';

function vibe(ms = 14) {
  try {
    (navigator as Navigator & { vibrate?: (duration: number) => void })?.vibrate?.(ms);
  } catch {}
}

function tint(hex: string, ratio: number) {
  const normalized = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
  const mix = (channel: number) => Math.round(channel + (255 - channel) * ratio);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export default function BuildSafePlace() {
  const [themeColor, setThemeColor] = useState('#A78BFA');
  const [expression, setExpression] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('themeColor');
    if (storedTheme) {
      setThemeColor(storedTheme);
    }
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      setExpression(savedDraft);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expression);
  }, [expression]);

  useEffect(() => {
    const observedEntries = stepRefs.current.filter(Boolean) as HTMLElement[];
    if (!observedEntries.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (!visibleEntries.length) return;

        const nextIndex = observedEntries.indexOf(visibleEntries[0].target as HTMLElement);
        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
        }
      },
      {
        root: null,
        rootMargin: '-18% 0px -25% 0px',
        threshold: [0.2, 0.4, 0.6, 0.8],
      }
    );

    observedEntries.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const background = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${tint(themeColor, 0.88)} 0%, #F6F7FE 55%)`,
    [themeColor]
  );

  const trackedStepCount = stepRefs.current.filter(Boolean).length;
  const progressRatio = trackedStepCount > 1 ? activeIndex / (trackedStepCount - 1) : 0;

  async function saveSafePlace() {
    vibe();
    const id = Date.now().toString(36);
    const normalizedExpression = expression.trim();
    const item: SafePlace = {
      id,
      name: normalizedExpression || 'Mon lieu sûr',
      answers: normalizedExpression ? [normalizedExpression] : [],
      createdAt: Date.now(),
    };

    let items: SafePlace[] = [];
    try {
      items = JSON.parse(localStorage.getItem('safePlacesV1') || '[]');
    } catch {
      items = [];
    }

    items.unshift(item);
    localStorage.setItem('safePlacesV1', JSON.stringify(items));

    try {
      await logActivity({
        category: 'SAFE_PLACE',
        subType: 'Construction',
        detail: item.name,
      });
    } catch {}

    localStorage.removeItem(STORAGE_KEY);
    window.location.href = `/exercice/safe-place/visit?highlight=${encodeURIComponent(id)}`;
  }

  return (
    <main style={{ ...page, background }}>
      <style>{css}</style>

      <header style={header}>
        <BackLink href="/exercice/safe-place" style={{ justifySelf: 'start' }} />
        <h1 style={title}>Construction de mon lieu sûr</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gearButton}>
          ⚙️
        </button>
      </header>

      <section style={contentLayout}>
        <div className="safe-place-steps" style={stepsColumn}>
          {SAFE_PLACE_STEPS.slice(0, 7).map((step, index) => (
            <article
              key={step}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              style={stepCard}
            >
              <p style={stepText}>{step}</p>
            </article>
          ))}

          <article
            ref={(node) => {
              stepRefs.current[7] = node;
            }}
            style={stepCard}
          >
            <p style={stepText}>{SAFE_PLACE_STEPS[7]}</p>
            <label htmlFor="safe-place-expression" style={srOnly}>
              Mot ou expression représentant mon lieu sûr
            </label>
            <input
              id="safe-place-expression"
              type="text"
              value={expression}
              maxLength={TEXT_INPUT_MAX_LENGTH}
              placeholder="Écris ton mot ou ton expression"
              onFocus={() => vibe(8)}
              onChange={(event) => setExpression(event.target.value)}
              style={expressionInput}
              aria-label="Mot ou expression représentant mon lieu sûr"
            />
          </article>

          <article
            ref={(node) => {
              stepRefs.current[8] = node;
            }}
            style={stepCard}
          >
            <p style={stepText}>{SAFE_PLACE_STEPS[8]}</p>
          </article>

          <article
            ref={(node) => {
              stepRefs.current[9] = node;
            }}
            style={stepCard}
          >
            <p style={stepText}>{SAFE_PLACE_STEPS[9]}</p>
          </article>

          <div
            ref={(node) => {
              stepRefs.current[10] = node;
            }}
            style={safeIconWrap}
          >
            <img
              src="/icons/lieusur.svg"
              alt="Icône du lieu sûr"
              width={138}
              height={138}
              style={safeIcon}
            />
          </div>

          <div style={saveWrap}>
            <button type="button" onClick={saveSafePlace} style={saveButton}>
              Enregistrer mon lieu sûr
            </button>
          </div>
        </div>

        <aside className="safe-place-progress" style={progressColumn} aria-hidden>
          <div style={progressTrack}>
            <div
              style={{
                ...progressThumb,
                top: `calc(${Math.max(0, Math.min(1, progressRatio)) * 100}% - 9px)`,
              }}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  color: '#0f172a',
  padding: 'max(16px, env(safe-area-inset-top)) 14px max(24px, env(safe-area-inset-bottom))',
  overflowX: 'clip',
};

const header: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 1fr 40px',
  alignItems: 'center',
  gap: 10,
  maxWidth: 760,
  margin: '0 auto 18px',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(18px, 4vw, 22px)',
  fontWeight: 800,
  textAlign: 'center',
};

const gearButton: React.CSSProperties = {
  justifySelf: 'end',
  border: '1px solid rgba(15,23,42,0.08)',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

const contentLayout: React.CSSProperties = {
  width: 'min(760px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 30px',
  gap: 10,
  alignItems: 'start',
};

const stepsColumn: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  minWidth: 0,
};

const stepCard: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  marginInline: 'auto',
  minHeight: 112,
  padding: '14px 14px',
  borderRadius: 20,
  textAlign: 'center',
  background: 'rgba(236, 233, 255, 0.94)',
  border: '1px solid rgba(167,139,250,0.18)',
  boxShadow: '0 10px 24px rgba(167,139,250,0.08)',
  display: 'grid',
  alignContent: 'center',
  gap: 10,
};

const stepText: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(15px, 2vw, 20px)',
  lineHeight: 1.22,
  color: 'rgba(31, 41, 55, 0.78)',
  overflowWrap: 'anywhere',
};

const expressionInput: React.CSSProperties = {
  width: '100%',
  maxWidth: 320,
  margin: '0 auto',
  border: 'none',
  borderBottom: '2px dotted rgba(76,29,149,0.4)',
  background: 'transparent',
  padding: '6px 4px 6px',
  textAlign: 'center',
  fontSize: 16,
  lineHeight: 1.4,
  color: '#20103F',
  outline: 'none',
};

const progressColumn: React.CSSProperties = {
  position: 'sticky',
  top: 'max(88px, env(safe-area-inset-top) + 72px)',
  display: 'grid',
  justifyItems: 'center',
  paddingTop: 8,
  paddingBottom: 80,
  minHeight: 420,
};

const progressTrack: React.CSSProperties = {
  position: 'relative',
  width: 3,
  height: 'min(68vh, 560px)',
  borderRadius: 999,
  background: 'rgba(167,139,250,0.28)',
};

const progressThumb: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: 'linear-gradient(180deg, #C4B5FD 0%, #A78BFA 100%)',
  transform: 'translateX(-50%)',
  boxShadow: '0 0 0 6px rgba(167,139,250,0.12)',
};

const safeIconWrap: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  placeItems: 'center',
  gridColumn: '1 / -1',
  paddingTop: 2,
  paddingBottom: 2,
};

const safeIcon: React.CSSProperties = {
  width: 'min(138px, 36vw)',
  height: 'auto',
  display: 'block',
};

const saveWrap: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  placeItems: 'center',
  gridColumn: '1 / -1',
  paddingBottom: 12,
};

const saveButton: React.CSSProperties = {
  minHeight: 52,
  padding: '12px 20px',
  borderRadius: 16,
  border: '1px solid rgba(139,92,246,0.24)',
  background: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 12px 24px rgba(139,92,246,0.24)',
};

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const css = `
  input::placeholder {
    color: rgba(31, 41, 55, 0.38);
  }

  input:focus {
    border-bottom-color: rgba(139, 92, 246, 0.88);
    box-shadow: 0 8px 18px rgba(167, 139, 250, 0.08);
  }

  @media (max-width: 640px) {
    main {
      padding-inline: 10px;
    }

    .safe-place-steps {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }

  @media (max-height: 920px) and (min-width: 900px) {
    .safe-place-steps {
      gap: 10px;
    }
  }

  @media (max-width: 560px) {
    .safe-place-progress {
      display: none;
    }
  }
`;
