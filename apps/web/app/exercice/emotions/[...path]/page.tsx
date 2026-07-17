'use client';
import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { logActivity, postHistoryEntry } from '../../../../lib/patientTracking';
import {
  activationValueToRoute,
  classifyActivationValue,
  getExercisesFallbackRoute,
  parseActivationOrigin,
  type ActivationOrigin,
} from '../../../../lib/activationFlow';

const PRIMARY = {
  joy: { label: 'Joie', color: '#FDE68A' },
  surprise: { label: 'Surprise', color: '#A7F3D0' },
  anger: { label: 'Colère', color: '#FCA5A5' },
  sadness: { label: 'Tristesse', color: '#93C5FD' },
  fear: { label: 'Peur', color: '#C4B5FD' },
  disgust: { label: 'Dégoût', color: '#FBCFE8' },
} as const;

type PrimaryKey = keyof typeof PRIMARY;
type Item = { key: string; label: string };

const CHILDREN: Record<PrimaryKey, Item[]> = {
  anger: [
    { key: 'blesse', label: 'Blessé' },
    { key: 'menace', label: 'Menacé' },
    { key: 'haineux', label: 'Haineux' },
    { key: 'en_colere', label: 'En colère' },
    { key: 'agressif', label: 'Agressif' },
    { key: 'frustre', label: 'Frustré' },
    { key: 'distant', label: 'Distant' },
    { key: 'critique', label: 'Critique' },
  ],
  disgust: [
    { key: 'reprobation', label: 'Réprobation' },
    { key: 'deception', label: 'Déception' },
    { key: 'terrible', label: 'Terrible' },
    { key: 'evitement', label: 'Évitement' },
  ],
  sadness: [
    { key: 'culpabilite', label: 'Culpabilité' },
    { key: 'abandon', label: 'Abandon' },
    { key: 'desespoir', label: 'Désespoir' },
    { key: 'depression', label: 'Dépression' },
    { key: 'solitude', label: 'Solitude' },
    { key: 'ennui', label: 'Ennui' },
  ],
  joy: [
    { key: 'heureux', label: 'Heureux' },
    { key: 'interesse', label: 'Intéressé' },
    { key: 'fier', label: 'Fier' },
    { key: 'accepte', label: 'Accepté' },
    { key: 'fort', label: 'Fort' },
    { key: 'paisible', label: 'Paisible' },
    { key: 'intime', label: 'Intime' },
    { key: 'optimisme', label: 'Optimisme' },
  ],
  surprise: [
    { key: 'surpris', label: 'Surpris' },
    { key: 'confus', label: 'Confus' },
    { key: 'etonne', label: 'Étonné' },
    { key: 'excite', label: 'Excité' },
  ],
  fear: [
    { key: 'humilie', label: 'Humilié' },
    { key: 'rejete', label: 'Rejeté' },
    { key: 'docile', label: 'Docile' },
    { key: 'insecure', label: 'Insécure' },
    { key: 'anxieux', label: 'Anxieux' },
    { key: 'appeure', label: 'Apeuré' },
  ],
};

const THIRD_RING: Record<PrimaryKey, Item[]> = {
  anger: [
    { key: 'embarrasse', label: 'Embarrassé' },
    { key: 'devaste', label: 'Dévasté' },
    { key: 'insecurise', label: 'Insécurisé' },
    { key: 'jaloux', label: 'Jaloux' },
    { key: 'amer', label: 'Amer' },
    { key: 'defiant', label: 'Défiant' },
    { key: 'furieux', label: 'Furieux' },
    { key: 'enrage', label: 'Enragé' },
    { key: 'provocateur', label: 'Provocateur' },
    { key: 'hostile', label: 'Hostile' },
    { key: 'mecontent', label: 'Mécontent' },
    { key: 'irrite', label: 'Irrité' },
    { key: 'retire', label: 'Retiré' },
    { key: 'suspect', label: 'Suspect' },
    { key: 'sceptique', label: 'Sceptique' },
    { key: 'sarcastique', label: 'Sarcastique' },
  ],
  disgust: [
    { key: 'juge', label: 'Jugé' },
    { key: 'aversion', label: 'Aversion' },
    { key: 'repugnant', label: 'Répugnant' },
    { key: 'revolte', label: 'Révolté' },
    { key: 'degout', label: 'Dégoût' },
    { key: 'detestable', label: 'Détestable' },
    { key: 'aversion2', label: 'Aversion' },
    { key: 'hesitant', label: 'Hésitant' },
  ],
  sadness: [
    { key: 'fautif', label: 'Fautif' },
    { key: 'honteux', label: 'Honteux' },
    { key: 'ignore', label: 'Ignoré' },
    { key: 'replie', label: 'Replié' },
    { key: 'impuissant', label: 'Impuissant' },
    { key: 'vulnerable', label: 'Vulnérable' },
    { key: 'minable', label: 'Minable' },
    { key: 'vide', label: 'Vide' },
    { key: 'abandonne', label: 'Abandonné' },
    { key: 'isole', label: 'Isolé' },
    { key: 'amorphe', label: 'Amorphe' },
    { key: 'indifferent', label: 'Indifférent' },
  ],
  joy: [
    { key: 'confiant', label: 'Confiant' },
    { key: 'libere', label: 'Libéré' },
    { key: 'extasie', label: 'Extasié' },
    { key: 'amuse', label: 'Amusé' },
    { key: 'curieux', label: 'Curieux' },
    { key: 'important', label: 'Important' },
    { key: 'respecte', label: 'Respecté' },
    { key: 'accompli', label: 'Accompli' },
    { key: 'courageux', label: 'Courageux' },
    { key: 'provocant', label: 'Provocant' },
    { key: 'aimant', label: 'Aimant' },
    { key: 'optimiste', label: 'Optimiste' },
    { key: 'sensible', label: 'Sensible' },
    { key: 'espiegle', label: 'Espiègle' },
    { key: 'ouvert', label: 'Ouvert' },
    { key: 'inspire', label: 'Inspiré' },
  ],
  surprise: [
    { key: 'choque', label: 'Choqué' },
    { key: 'consterne', label: 'Consterné' },
    { key: 'desillusionne', label: 'Désillusionné' },
    { key: 'perplexe', label: 'Perplexe' },
    { key: 'abasourdi', label: 'Abasourdi' },
    { key: 'effraye', label: 'Effrayé' },
    { key: 'avide', label: 'Avide' },
    { key: 'energique', label: 'Énergique' },
  ],
  fear: [
    { key: 'ridiculise', label: 'Ridiculisé' },
    { key: 'non_respecte', label: 'Non respecté' },
    { key: 'exclus', label: 'Exclus' },
    { key: 'inadequat', label: 'Inadéquat' },
    { key: 'insignifiant', label: 'Insignifiant' },
    { key: 'sans_valeur', label: 'Sans valeur' },
    { key: 'inferieur', label: 'Inférieur' },
    { key: 'incapable', label: 'Incapable' },
    { key: 'preoccupe', label: 'Préoccupé' },
    { key: 'accable', label: 'Accablé' },
    { key: 'craintif', label: 'Craintif' },
    { key: 'terrifie', label: 'Terrifié' },
  ],
};

type PageSearchParams = {
  from?: string | string[];
};

const EDUCATIONAL_MESSAGES = [
  "Sais-tu que l’identification précise des émotions authentiques est une étape préalable essentielle à leur régulation.",
  "As-tu déjà entendu parler du concept de granularité émotionnelle : une meilleure différenciation des émotions est associée à une régulation émotionnelle plus efficace !",
] as const;

type FollowupStep = 'choices' | 'gradient' | 'after-gradient';

export default function EmotionDetailPage({
  params,
  searchParams,
}: {
  params: { path: string[] };
  searchParams?: PageSearchParams;
}) {
  const segs = params.path || [];
  const initialFrom = typeof searchParams?.from === 'string' ? searchParams.from : null;
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [hasMounted, setHasMounted] = useState(false);
  const root = (segs[0] as PrimaryKey) || 'joy';
  const level2Key = segs[1];
  const level3Key = segs[2];
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [followupOpen, setFollowupOpen] = useState(Boolean(level3Key));
  const [followupStep, setFollowupStep] = useState<FollowupStep>('choices');
  const [gradientValue, setGradientValue] = useState(50);
  const [messageIndex, setMessageIndex] = useState(0);
  const [gradientBusy, setGradientBusy] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const nextFrom = new URLSearchParams(window.location.search).get('from');
    setFrom(nextFrom);
  }, [initialFrom]);

  useEffect(() => {
    if (!level3Key) {
      setFollowupOpen(false);
      setFollowupStep('choices');
      return;
    }

    setFollowupOpen(true);
    setFollowupStep('choices');
    setGradientValue(50);
    setMessageIndex(Math.floor(Math.random() * EDUCATIONAL_MESSAGES.length));
  }, [level3Key]);

  const theme = PRIMARY[root] ?? PRIMARY.joy;
  const withFrom = (href: string) => (from ? `${href}?from=${encodeURIComponent(from)}` : href);
  const activationOrigin: ActivationOrigin | null = parseActivationOrigin(from);
  const backHref = withFrom(
    segs.length <= 1 ? '/exercice/emotions' : `/exercice/emotions/${segs.slice(0, -1).join('/')}`
  );
  const homeHref = getExercisesFallbackRoute(activationOrigin);
  const originExercisesHref = getExercisesFallbackRoute(activationOrigin);

  const items: Item[] = useMemo(() => {
    if (!(root in PRIMARY)) return [];
    if (!level2Key) return CHILDREN[root];
    return THIRD_RING[root] ?? [];
  }, [root, level2Key]);

  const title = (() => {
    if (!level2Key) return `Sous-émotions : ${theme.label}`;
    if (!level3Key) return `Affiner : ${labelOf(level2Key)} (${theme.label})`;
    return `Tu as choisi : ${labelOf(level3Key)}`;
  })();

  function destFor(item: Item) {
    const nextSegs = !level2Key ? [root, item.key] : [root, level2Key, item.key];
    return withFrom(`/exercice/emotions/${nextSegs.join('/')}`);
  }

  function press() {
    if ('vibrate' in navigator) try { (navigator as any).vibrate?.(16); } catch {}
  }

  const slices = useMemo(() => buildSlices(items.length || 1, 140), [items.length]);

  async function handleItemClick(item: Item) {
    if (pendingKey) return;

    const href = destFor(item);

    if (!level2Key || level3Key) {
      window.location.href = href;
      return;
    }

    setPendingKey(item.key);

    try {
      await logActivity({
        category: 'EMOTION',
        subType: `${labelOf(level2Key)}/${item.label}`,
        detail: [PRIMARY[root]?.label ?? root, labelOf(level2Key), item.label].join('/'),
        emotion: root.toUpperCase(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      window.location.href = href;
    }
  }

  async function handleGradientSubmit() {
    if (gradientBusy) return;

    setGradientBusy(true);

    try {
      await postHistoryEntry(classifyActivationValue(gradientValue));
    } catch (error) {
      console.error(error);
    } finally {
      setGradientBusy(false);
      setFollowupStep('after-gradient');
    }
  }

  function navigateTo(href: string) {
    window.location.href = href;
  }

  return (
    <main style={styles.page(bg(theme.color))}>
      <style>{modalCss}</style>
      <header style={styles.header}>
        <BackLink href={backHref} style={styles.back} />
        <h1 style={styles.h1}>{title}</h1>
        <div />
      </header>

      <nav style={styles.crumbs}>
        <a href={withFrom('/exercice/emotions')} style={chip('#fff', '#0f172a')}>Roue</a>
        <span style={{ margin: '0 6px', opacity: .5 }}>›</span>
        <a href={withFrom(`/exercice/emotions/${root}`)} style={chip(theme.color, '#111')}>{PRIMARY[root]?.label ?? root}</a>
        {level2Key && (
          <>
            <span style={{ margin: '0 6px', opacity: .5 }}>›</span>
            <a href={withFrom(`/exercice/emotions/${root}/${level2Key}`)} style={chip('#fff', '#0f172a')}>
              {labelOf(level2Key)}
            </a>
          </>
        )}
        {level3Key && (
          <>
            <span style={{ margin: '0 6px', opacity: .5 }}>›</span>
            <span style={chip('#fff', '#0f172a')}>{labelOf(level3Key)}</span>
          </>
        )}
      </nav>

      {items.length > 0 ? (
        <section className="emotion-wheel-wrap" style={styles.wheelWrap}>
          <svg
            viewBox="-160 -160 320 320"
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            style={styles.svg}
            role="group"
            aria-label="Roue des sous-émotions"
          >
            {items.map((it, i) => {
              const s = slices[i];
              const labelLayout = getSliceLabelLayout(it.label, items.length, 140, s.start, s.end);
              return (
                <g key={it.key}>
                  <path
                    d={s.path}
                    fill={tint(theme.color, 0.35)}
                    stroke="#fff"
                    strokeWidth={1}
                    className="emotion-slice"
                    style={styles.slicePath}
                    role="link"
                    tabIndex={pendingKey ? -1 : 0}
                    onMouseDown={press}
                    onFocus={() => press()}
                    onClick={() => { void handleItemClick(it); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleItemClick(it);
                      }
                    }}
                  />
                  <text
                    x={labelLayout.x}
                    y={labelLayout.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight={700}
                    fontSize={labelLayout.fontSize}
                    fill="#0f172a"
                    pointerEvents="none"
                  >
                    {labelLayout.lines.length === 1 ? (
                      labelLayout.lines[0]
                    ) : (
                      <>
                        <tspan x={labelLayout.x} dy="-0.55em">
                          {labelLayout.lines[0]}
                        </tspan>
                        <tspan x={labelLayout.x} dy="1.1em">
                          {labelLayout.lines[1]}
                        </tspan>
                      </>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>
      ) : (
        <section style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ opacity: .7, fontSize: 15 }}>
            Pas d’affinage supplémentaire ici. Tu peux revenir en arrière ou choisir une autre sous-émotion.
          </p>
        </section>
      )}

      <footer style={styles.footer}>
        <a href={withFrom('/exercice/emotions')} style={btnSecondary}>Réinitialiser</a>
        <a
          href={homeHref}
          style={{
            ...btnPlain,
            pointerEvents: pendingKey ? 'none' : undefined,
            opacity: pendingKey ? 0.6 : btnPlain.opacity,
          }}
        >
          Accueil hyperactivation
        </a>
      </footer>

      {hasMounted && followupOpen && level3Key ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="emotion-followup-title">
          <div style={styles.modalCard}>
            <div style={styles.modalGlow} aria-hidden="true" />
            {followupStep === 'choices' ? (
              <>
                <div style={styles.sparklesLayer} aria-hidden="true">
                  {SPARKLES.map((sparkle) => (
                    <span
                      key={sparkle.id}
                      className="emotion-popup-sparkle"
                      style={sparkleStyle(sparkle)}
                    />
                  ))}
                </div>
                <div className="emotion-popup-spark" style={styles.sparkWrap} aria-hidden="true">
                  <div style={styles.sparkRing} />
                  <div style={styles.sparkDot} />
                </div>
                <p style={styles.modalEyebrow}>Roue des émotions</p>
                <h2 id="emotion-followup-title" style={styles.modalTitle}>Roue des émotions</h2>
                <p style={styles.modalText}>
                  Merci d’avoir pris le temps de compléter la roue des émotions.
                </p>
                <p style={styles.modalTextSecondary}>{EDUCATIONAL_MESSAGES[messageIndex]}</p>

                <div style={styles.modalActionsColumn}>
                  <button type="button" style={styles.primaryAction} onClick={() => setFollowupStep('gradient')}>
                    Réactualiser mon niveau d’activation
                  </button>
                  <button type="button" style={styles.secondaryAction} onClick={() => navigateTo(originExercisesHref)}>
                    Reprendre mes exercices
                  </button>
                  <button type="button" style={styles.stopAction} onClick={() => navigateTo('/app')}>
                    Arrêter pour le moment
                    <span style={styles.stopSubLabel}>Je souhaite arrêter pour le moment</span>
                  </button>
                </div>
              </>
            ) : null}

            {followupStep === 'gradient' ? (
              <>
                <h2 id="emotion-followup-title" style={styles.modalTitle}>Comment te sens-tu maintenant ?</h2>
                <p style={styles.modalText}>
                  Déplace le curseur pour ajuster ton niveau d’activation, puis indique si tu souhaites continuer vers les exercices correspondant à ton état actuel.
                </p>

                <div style={styles.gradientHintRow} aria-hidden="true">
                  <span style={styles.arrowLeft}>←</span>
                  <span style={styles.arrowRight}>→</span>
                </div>

                <div style={styles.sliderWrap}>
                  <input
                    aria-label="Niveau d’activation"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={gradientValue}
                    onChange={(event) => setGradientValue(Number(event.currentTarget.value))}
                    style={sliderStyle(gradientValue)}
                  />
                  <div style={styles.sliderLabels}>
                    <span style={styles.sliderEdgeLabel}>Hypoactivation</span>
                    <span style={styles.sliderCenterLabel}>Fenêtre de tolérance</span>
                    <span style={styles.sliderEdgeLabel}>Hyperactivation</span>
                  </div>
                </div>

                <div style={styles.modalFooterRow}>
                  <button type="button" style={styles.secondaryGhostAction} onClick={() => setFollowupStep('choices')} disabled={gradientBusy}>
                    Retour
                  </button>
                  <button type="button" style={styles.primaryAction} onClick={() => void handleGradientSubmit()} disabled={gradientBusy}>
                    {gradientBusy ? 'Enregistrement…' : 'Valider mon niveau d’activation'}
                  </button>
                </div>
              </>
            ) : null}

            {followupStep === 'after-gradient' ? (
              <>
                <h2 id="emotion-followup-title" style={styles.modalTitle}>Merci d’avoir réactualisé ton niveau d’activation.</h2>
                <p style={styles.modalText}>
                  Tu peux maintenant poursuivre vers les exercices les plus adaptés à ton niveau d’activation actuel.
                </p>

                <div style={styles.modalActionsColumn}>
                  <button type="button" style={styles.primaryAction} onClick={() => navigateTo(activationValueToRoute(gradientValue))}>
                    Continuer vers les exercices correspondants
                  </button>
                  <button type="button" style={styles.stopAction} onClick={() => navigateTo('/app')}>
                    Arrêter pour le moment
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function bg(hex: string) {
  return `radial-gradient(1200px 800px at 50% -10%, ${tint(hex, 0.85)} 0%, #F6F7FE 55%)`;
}
function tint(hex: string, t: number) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  const to = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
}
function labelOf(key: string) {
  const all = Object.values(CHILDREN).flat().concat(...Object.values(THIRD_RING));
  return all.find((i) => i.key === key)?.label ?? key;
}

function buildSlices(count: number, radius: number) {
  const sweep = 360 / Math.max(1, count);
  const cx = 0, cy = 0;

  return new Array(Math.max(1, count)).fill(0).map((_, i) => {
    const start = -90 + i * sweep;
    const end = start + sweep;

    const startRad = toRad(start);
    const endRad = toRad(end);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = sweep > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const mid = start + sweep / 2;
    const midRad = toRad(mid);
    const labelR = radius * 0.58;
    const labelPos = { x: cx + labelR * Math.cos(midRad), y: cy + labelR * Math.sin(midRad) };

    return { path, labelPos, start, end };
  });
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }

function getSliceLabelLayout(label: string, sliceCount: number, wheelRadius: number, startAngle: number, endAngle: number) {
  const middleAngle = (startAngle + endAngle) / 2;
  const angleRad = toRad(middleAngle);
  const labelRadiusRatio =
    sliceCount >= 14 ? 0.72 :
    sliceCount >= 12 ? 0.7 :
    sliceCount >= 10 ? 0.68 :
    sliceCount >= 8 ? 0.65 : 0.6;
  const labelRadius = wheelRadius * labelRadiusRatio;
  const x = labelRadius * Math.cos(angleRad);
  const y = labelRadius * Math.sin(angleRad);
  const availableWidth = estimateSliceWidth(startAngle, endAngle, labelRadius);
  const fontSize = getLabelFontSize(label, sliceCount, wheelRadius, availableWidth);
  const lines = splitLabel(label, availableWidth, fontSize);

  return { x, y, fontSize, lines };
}

function estimateSliceWidth(startAngle: number, endAngle: number, labelRadius: number) {
  const angle = Math.max(8, endAngle - startAngle);
  const angleRad = toRad(angle);
  return Math.max(28, 2 * labelRadius * Math.sin(angleRad / 2) * 0.8);
}

function getLabelFontSize(label: string, sliceCount: number, wheelRadius: number, availableWidth: number) {
  const wordlessLength = Math.max(1, label.replace(/\s+/g, '').length);
  const base =
    sliceCount >= 14 ? 7.2 :
    sliceCount >= 12 ? 8.2 :
    sliceCount >= 10 ? 9.3 :
    sliceCount >= 8 ? 10.6 : 12;
  const wheelFactor = wheelRadius >= 140 ? 1 : 0.92;
  const widthFactor = availableWidth / (wordlessLength * 0.58);
  const computed = Math.min(base, widthFactor) * wheelFactor;
  return clamp(computed, sliceCount >= 12 ? 6.4 : 7.2, sliceCount >= 12 ? 11 : 14);
}

function splitLabel(label: string, availableWidth: number, fontSize: number) {
  const words = label.trim().split(/\s+/);
  if (words.length <= 1) return [label];

  if (estimateTextWidth(label, fontSize) <= availableWidth) return [label];

  let best: [string, string] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    const longest = Math.max(estimateTextWidth(left, fontSize), estimateTextWidth(right, fontSize));
    const balance = Math.abs(left.length - right.length);
    const overflowPenalty = longest > availableWidth ? (longest - availableWidth) * 10 : 0;
    const score = overflowPenalty + balance;

    if (score < bestScore) {
      bestScore = score;
      best = [left, right];
    }
  }

  return best ?? [label];
}

function estimateTextWidth(value: string, fontSize: number) {
  return value.length * fontSize * 0.52;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = {
  page: (background: string): React.CSSProperties => ({
    minHeight: '100dvh',
    background,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowX: 'hidden',
    padding: '16px 20px 14px',
  }),
  header: {
    width: '100%',
    maxWidth: 820,
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    marginBottom: 6,
  } as React.CSSProperties,
  back: { justifySelf: 'start' } as React.CSSProperties,
  h1: { margin: 0, textAlign: 'center', fontSize: 22, letterSpacing: .2 } as React.CSSProperties,
  crumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    margin: '6px 0 10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  } as React.CSSProperties,
  wheelWrap: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'min(82vw, calc(100dvh - 230px), 680px)',
    aspectRatio: '1 / 1',
    maxWidth: '100%',
  } as React.CSSProperties,
  svg: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    boxShadow: '0 12px 28px rgba(0,0,0,.08)',
    background: '#fff',
  } as React.CSSProperties,
  slicePath: { cursor: 'pointer', outline: 'none', transition: 'filter .12s ease' } as React.CSSProperties,
  footer: {
    display: 'flex',
    gap: 12,
    margin: '12px 0 0',
    paddingBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.34)',
    backdropFilter: 'blur(6px)',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    zIndex: 50,
  } as React.CSSProperties,
  modalCard: {
    width: 'min(100%, 560px)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    borderRadius: 28,
    border: '1px solid rgba(148,163,184,0.22)',
    boxShadow: '0 30px 70px rgba(15,23,42,0.2)',
    padding: '28px 22px 24px',
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gap: 16,
  } as React.CSSProperties,
  modalGlow: {
    position: 'absolute',
    inset: 'auto -10% 72% auto',
    width: 220,
    height: 220,
    background: 'radial-gradient(circle, rgba(196,181,253,0.55) 0%, rgba(196,181,253,0) 70%)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  sparklesLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 1,
  } as React.CSSProperties,
  sparkWrap: {
    width: 84,
    height: 84,
    margin: '0 auto 4px',
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  sparkRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #ede9fe 0%, #c4b5fd 48%, #a78bfa 100%)',
    opacity: 0.88,
  } as React.CSSProperties,
  sparkDot: {
    position: 'absolute',
    inset: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 8px 22px rgba(167,139,250,0.28)',
  } as React.CSSProperties,
  modalTitle: {
    margin: 0,
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 1.15,
    color: '#0f172a',
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  modalEyebrow: {
    margin: 0,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7c3aed',
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  modalText: {
    margin: 0,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 1.55,
    color: '#334155',
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  modalTextSecondary: {
    margin: 0,
    padding: '14px 16px',
    borderRadius: 18,
    background: 'rgba(237,233,254,0.6)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 1.55,
    color: '#4c1d95',
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  modalActionsColumn: {
    display: 'grid',
    gap: 12,
    marginTop: 4,
    position: 'relative',
    zIndex: 2,
  } as React.CSSProperties,
  primaryAction: {
    border: 'none',
    borderRadius: 18,
    padding: '16px 18px',
    background: 'linear-gradient(180deg, #ddd6fe 0%, #c4b5fd 100%)',
    color: '#312e81',
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 14px 26px rgba(167,139,250,0.22)',
  } as React.CSSProperties,
  secondaryAction: {
    border: '1px solid rgba(148,163,184,0.28)',
    borderRadius: 18,
    padding: '16px 18px',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  } as React.CSSProperties,
  stopAction: {
    border: '1px solid rgba(148,163,184,0.24)',
    borderRadius: 18,
    padding: '14px 18px',
    background: 'rgba(248,250,252,0.95)',
    color: '#334155',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    display: 'grid',
    gap: 4,
    justifyItems: 'center',
  } as React.CSSProperties,
  stopSubLabel: {
    display: 'none',
  } as React.CSSProperties,
  gradientHintRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 36,
    alignItems: 'center',
    marginTop: 6,
    color: '#c4b5fd',
    fontSize: 34,
    fontWeight: 900,
  } as React.CSSProperties,
  arrowLeft: { transform: 'translateX(-4px)' } as React.CSSProperties,
  arrowRight: { transform: 'translateX(4px)' } as React.CSSProperties,
  sliderWrap: {
    display: 'grid',
    gap: 18,
    padding: '6px 4px 2px',
  } as React.CSSProperties,
  sliderLabels: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'start',
    gap: 8,
  } as React.CSSProperties,
  sliderEdgeLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  } as React.CSSProperties,
  sliderCenterLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: '#312e81',
    textAlign: 'center',
  } as React.CSSProperties,
  modalFooterRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: 12,
  } as React.CSSProperties,
  secondaryGhostAction: {
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 16,
    padding: '14px 16px',
    background: '#fff',
    color: '#475569',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
};

function sliderStyle(value: number): React.CSSProperties {
  return {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: 18,
    borderRadius: 999,
    outline: 'none',
    background: `linear-gradient(90deg, #e9d5ff 0%, #f5d0fe 26%, #c4b5fd 50%, #d8b4fe 74%, #a855f7 100%)`,
    boxShadow: 'inset 0 0 0 1px rgba(167,139,250,0.14)',
    ['--thumb-position' as string]: `${value}%`,
  };
}

const SPARKLES = [
  { id: 's1', top: 18, left: 38, size: 14, color: '#ec4899', delay: '0s', duration: '2.9s' },
  { id: 's2', top: 46, left: 86, size: 11, color: '#3b82f6', delay: '.35s', duration: '3.4s' },
  { id: 's3', top: 84, left: 24, size: 12, color: '#f59e0b', delay: '.7s', duration: '3.1s' },
  { id: 's4', top: 88, right: 26, size: 13, color: '#10b981', delay: '.25s', duration: '3.2s' },
  { id: 's5', top: 24, right: 70, size: 10, color: '#8b5cf6', delay: '.55s', duration: '2.8s' },
  { id: 's6', top: 122, right: 54, size: 12, color: '#ef4444', delay: '.9s', duration: '3.6s' },
] as const;

function sparkleStyle(sparkle: typeof SPARKLES[number]): React.CSSProperties {
  return {
    position: 'absolute',
    top: sparkle.top,
    left: 'left' in sparkle ? sparkle.left : undefined,
    right: 'right' in sparkle ? sparkle.right : undefined,
    width: sparkle.size,
    height: sparkle.size,
    color: sparkle.color,
    animationDelay: sparkle.delay,
    animationDuration: sparkle.duration,
  };
}

const modalCss = `
  @media (min-width: 1024px) {
    .emotion-wheel-wrap {
      width: min(70vw, calc(100dvh - 210px), 680px) !important;
    }
  }

  @media (max-width: 768px) {
    .emotion-wheel-wrap {
      width: min(92vw, calc(100dvh - 250px)) !important;
    }
  }

  @media (max-height: 750px) and (min-width: 769px) {
    .emotion-wheel-wrap {
      width: min(65vw, calc(100dvh - 190px), 560px) !important;
    }
  }

  .emotion-popup-spark {
    animation: emotionPopupFloat 2.8s ease-in-out infinite;
  }

  .emotion-popup-sparkle {
    display: block;
    opacity: 0;
    transform: translateY(8px) scale(.7) rotate(0deg);
    animation-name: emotionPopupSparkle;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    filter: drop-shadow(0 6px 12px rgba(255,255,255,.65));
  }

  .emotion-popup-sparkle::before,
  .emotion-popup-sparkle::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: currentColor;
  }

  .emotion-popup-sparkle::before {
    transform: rotate(45deg) scaleX(.3);
  }

  .emotion-popup-sparkle::after {
    transform: rotate(45deg) scaleY(.3);
  }

  @media (max-width: 640px) {
    button {
      -webkit-tap-highlight-color: transparent;
    }
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

  @keyframes emotionPopupFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.03); }
  }

  @keyframes emotionPopupSparkle {
    0%, 100% { opacity: 0; transform: translateY(8px) scale(.7) rotate(0deg); }
    20% { opacity: .95; transform: translateY(0) scale(1) rotate(20deg); }
    60% { opacity: .55; transform: translateY(-7px) scale(1.08) rotate(90deg); }
    80% { opacity: 0; transform: translateY(-12px) scale(.85) rotate(140deg); }
  }
`;

function chip(bg: string, fg: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,.06)',
    background: bg,
    color: fg,
    textDecoration: 'none',
    fontSize: 13,
  };
}

const btnSecondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 14px',
  borderRadius: 12,
  background: '#fff',
  color: '#111827',
  textDecoration: 'none',
  border: '1px solid rgba(0,0,0,.08)',
};

const btnPlain: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 14px',
  borderRadius: 12,
  background: 'rgba(255,255,255,.72)',
  color: '#0f172a',
  textDecoration: 'none',
  opacity: 0.9,
};
