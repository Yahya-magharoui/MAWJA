'use client';
import { useMemo, useState } from 'react';

/** données */
const EMOTIONS = [
  { key: 'joy',       label: 'Joie',       color: '#FDE68A' },
  { key: 'surprise',  label: 'Surprise',   color: '#A7F3D0' },
  { key: 'anger',     label: 'Colère',     color: '#FCA5A5' },
  { key: 'sadness',   label: 'Tristesse',  color: '#93C5FD' },
  { key: 'fear',      label: 'Peur',       color: '#C4B5FD' },
  { key: 'disgust',   label: 'Dégoût',     color: '#FBCFE8' },
] as const;

type Emotion = typeof EMOTIONS[number];

export default function EmotionWheel() {
  const [hovered, setHovered] = useState<Emotion | null>(null);

  function pressFeedback() {
    if ('vibrate' in navigator) { try { (navigator as any).vibrate?.(18); } catch {} }
  }

  /** géométrie de la roue en SVG */
  const slices = useMemo(() => buildSlices(EMOTIONS.length, 140), []);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <a href="/hyperactivation" aria-label="Retour" style={styles.backLink}>←</a>
        <h1 style={styles.h1}>Roue des émotions</h1>
        <div />
      </header>

      <p style={styles.subtitle}>Prends un instant et choisis l’émotion que tu ressens.</p>

      <div style={styles.wheelWrap}>
        {/* étiquette centrale */}
        <div style={styles.center}>
          <span style={styles.centerBadge}>
            {hovered?.label ?? 'Choisis une émotion'}
          </span>
        </div>

        {/* La roue SVG */}
        <svg
          viewBox="-160 -160 320 320"
          // important: width/height en CSS, pas de "min()" dans l'attribut
          style={{ ...styles.svg, width: 'min(420px, 80vw)', height: 'min(420px, 80vw)' }}
          role="group"
          aria-label="Roue des émotions"
        >
          {EMOTIONS.map((emo, i) => {
  const s = slices[i];
  const isDim = hovered && hovered.key !== emo.key;
  const href = `/exercice/emotions/${encodeURIComponent(emo.key)}`;

  return (
    <g key={emo.key}
       onMouseEnter={() => setHovered(emo)}
       onMouseLeave={() => setHovered(null)}>

      {/* secteur cliquable */}
      <path
        d={s.path}
        fill={emo.color}
        stroke="#fff"
        strokeWidth={1}
        style={{
          cursor: 'pointer',
          filter: isDim ? 'grayscale(.15) brightness(.98)' : 'none',
          transition: 'filter .15s ease',
        }}
        role="link"
        tabIndex={0}
        onMouseDown={pressFeedback}
        onClick={() => { window.location.href = href; }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = href;
          }
        }}
      />

      {/* libellé centré */}
      <text
        x={s.labelPos.x}
        y={s.labelPos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight={700}
        fontSize={12}
        fill="#0f172a"
        pointerEvents="none"
      >
        {emo.label}
      </text>
    </g>
  );
})}

        </svg>
      </div>
    </main>
  );
}

/** —— géométrie SVG —— */
function buildSlices(count: number, radius: number) {
  const sweep = 360 / count;
  const cx = 0, cy = 0;

  return new Array(count).fill(0).map((_, i) => {
    const start = -90 + i * sweep;          // on commence en haut
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

    return { path, labelPos };
  });
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

/** —— styles —— */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#F6F7FE',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    justifyItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    maxWidth: 780,
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    marginBottom: 6,
  },
  backLink: { textDecoration: 'none', color: '#111', fontSize: 20 },
  h1: { margin: 0, textAlign: 'center', fontSize: 22, letterSpacing: .2 },
  subtitle: { margin: '8px 0 18px', opacity: .7, fontSize: 14, textAlign: 'center' },

  wheelWrap: { position: 'relative' },
  svg: {
    display: 'block',
    borderRadius: '50%',
    boxShadow: '0 12px 28px rgba(0,0,0,.08)',
    background: '#fff',
  },
  center: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    pointerEvents: 'none',
  },
  centerBadge: {
    fontWeight: 800,
    fontSize: 20,
    background: 'rgba(255,255,255,.8)',
    border: '1px solid rgba(0,0,0,.06)',
    borderRadius: 12,
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,.06)',
  },
};
