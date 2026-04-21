'use client';
import { useMemo, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { logActivity } from '../../../../lib/patientTracking';

/** ——— Données de base (mêmes couleurs que la 1ère roue) ——— */
const PRIMARY = {
  joy:      { label: 'Joie',       color: '#FDE68A' },
  surprise: { label: 'Surprise',   color: '#A7F3D0' },
  anger:    { label: 'Colère',     color: '#FCA5A5' },
  sadness:  { label: 'Tristesse',  color: '#93C5FD' },
  fear:     { label: 'Peur',       color: '#C4B5FD' },
  disgust:  { label: 'Dégoût',     color: '#FBCFE8' },
} as const;

type PrimaryKey = keyof typeof PRIMARY;

type Item = { key: string; label: string };

/** ——— Sous-émotions (niveau 2) ——— */
const CHILDREN: Record<PrimaryKey, Item[]> = {
  // JOIE
  joy: [
    { key: 'heureux',   label: 'Heureux' },
    { key: 'optimisme', label: 'Optimisme' },
    { key: 'intime',    label: 'Intime' },
    { key: 'paisible',  label: 'Paisible' },
    { key: 'fort',      label: 'Fort' },
    { key: 'accepte',   label: 'Accepté' },
    { key: 'fier',      label: 'Fier' },
    { key: 'interesse', label: 'Intéressé' },
  ],

  // SURPRISE
  surprise: [
    { key: 'excite',   label: 'Excité' },
    { key: 'surpris',  label: 'Surpris' },
    { key: 'confus',   label: 'Confus' },
    { key: 'etonne',   label: 'Étonné' },
  ],

  // COLÈRE
  anger: [
    { key: 'critique',  label: 'Critique' },
    { key: 'blesse',    label: 'Blessé' },
    { key: 'menace',    label: 'Menacé' },
    { key: 'haineux',   label: 'Haineux' },
    { key: 'en_colere', label: 'En colère' },
    { key: 'agressif',  label: 'Agressif' },
    { key: 'frustre',   label: 'Frustré' },
    { key: 'distant',   label: 'Distant' },
  ],

  // TRISTESSE
  sadness: [
    { key: 'ennui',        label: 'Ennui' },
    { key: 'culpabilite',  label: 'Culpabilité' },
    { key: 'abandon',      label: 'Abandon' },
    { key: 'desespoir',    label: 'Désespoir' },
    { key: 'depression',   label: 'Dépression' },
    { key: 'solitude',     label: 'Solitude' },
  ],

  // PEUR
  fear: [
    { key: 'appeure',  label: 'Appeuré' },
    { key: 'humilie',  label: 'Humilié' },
    { key: 'rejete',   label: 'Rejeté' },
    { key: 'docile',   label: 'Docile' },
    { key: 'insecure', label: 'Insécure' },
    { key: 'anxieux',  label: 'Anxieux' },
  ],

  // DÉGOÛT
  disgust: [
    { key: 'evitement',   label: 'Évitement' },
    { key: 'reprobation', label: 'Réprobation' },
    { key: 'deception',   label: 'Déception' },
    { key: 'terrible',    label: 'Terrible' },
  ],
};

/** ——— Sous-sous-émotions (niveau 3) ——— */
const GRANDCHILDREN: Record<string, Item[]> = {
  // JOIE
  heureux:     [
    { key: 'inspire',   label: 'Inspiré' },
    { key: 'libere',    label: 'Libéré' },
  ],
  optimisme:   [
    { key: 'optimiste', label: 'Optimiste' },
    { key: 'confiant',  label: 'Confiant' },
  ],
  intime:      [
    { key: 'aimant',    label: 'Aimant' },
    { key: 'sensible',  label: 'Sensible' },
  ],
  paisible:    [
    { key: 'accompli',  label: 'Accompli' },
    { key: 'respecte',  label: 'Respecté' },
  ],
  fort:        [
    { key: 'courageux', label: 'Courageux' },
    { key: 'ouvert',    label: 'Ouvert' },
  ],
  accepte:     [
    { key: 'important', label: 'Important' },
    { key: 'accompli2', label: 'Accompli' },
  ],
  fier:        [
    { key: 'provocant', label: 'Provocant' },
    { key: 'accompli3', label: 'Accompli' },
  ],
  interesse:   [
    { key: 'curieux',   label: 'Curieux' },
    { key: 'amuse',     label: 'Amusé' },
    { key: 'extasie',   label: 'Extasié' },
    { key: 'espiegle',  label: 'Espiègle' },
  ],

  // SURPRISE
  excite:  [
    { key: 'energique', label: 'Énergique' },
    { key: 'avide',     label: 'Avide' },
  ],
  surpris: [
    { key: 'choque',     label: 'Choqué' },
    { key: 'abasourdi',  label: 'Abasourdi' },
  ],
  confus:  [
    { key: 'perplexe',       label: 'Perplexe' },
    { key: 'consterne',      label: 'Consterné' },
  ],
  etonne:  [
    { key: 'desillusionne',  label: 'Désillusionné' },
    { key: 'effraye',        label: 'Effrayé' },
  ],

  // COLÈRE
  critique: [
    { key: 'sarcastique', label: 'Sarcastique' },
    { key: 'amer',        label: 'Amer' },
  ],
  blesse: [
    { key: 'enrage',      label: 'Enragé' },
    { key: 'furieux',     label: 'Furieux' },
  ],
  menace: [
    { key: 'defiant',     label: 'Défiant' },
    { key: 'provocateur', label: 'Provocateur' },
  ],
  haineux: [
    { key: 'hostile',     label: 'Hostile' },
    { key: 'mecontent',   label: 'Mécontent' },
  ],
  en_colere: [
    { key: 'irrite',      label: 'Irrité' },
    { key: 'furieux2',    label: 'Furieux' },
  ],
  agressif: [
    { key: 'retire',      label: 'Retiré' },
    { key: 'suspect',     label: 'Suspect' },
  ],
  frustre: [
    { key: 'sceptique',   label: 'Sceptique' },
    { key: 'mecontent2',  label: 'Mécontent' },
  ],
  distant: [
    { key: 'retire2',     label: 'Retiré' },
    { key: 'suspect2',    label: 'Suspect' },
  ],

  // PEUR
  appeure: [
    { key: 'terrifié',    label: 'Terrifié' },
    { key: 'craintif',    label: 'Craintif' },
  ],
  humilie: [
    { key: 'ridiculise',      label: 'Ridiculisé' },
    { key: 'non_respecte',    label: 'Non respecté' },
  ],
  rejete: [
    { key: 'exclus',         label: 'Exclus' },
    { key: 'sans_valeur',    label: 'Sans valeur' },
  ],
  docile: [
    { key: 'inferieur',      label: 'Inférieur' },
    { key: 'incapable',      label: 'Incapable' },
  ],
  insecure: [
    { key: 'inadequat',      label: 'Inadéquat' },
    { key: 'insignifiant',   label: 'Insignifiant' },
  ],
  anxieux: [
    { key: 'preoccupe',      label: 'Préoccupé' },
    { key: 'accable',        label: 'Accablé' },
  ],

  // TRISTESSE
  ennui: [
    { key: 'amorphe',     label: 'Amorphe' },
    { key: 'indifferent', label: 'Indifférent' },
  ],
  culpabilite: [
    { key: 'fautif',      label: 'Fautif' },
    { key: 'honteux',     label: 'Honteux' },
  ],
  abandon: [
    { key: 'abandonne',   label: 'Abandonné' },
    { key: 'isole',       label: 'Isolé' },
  ],
  desespoir: [
    { key: 'impuissant',  label: 'Impuissant' },
    { key: 'minable',     label: 'Minable' },
  ],
  depression: [
    { key: 'vide',        label: 'Vide' },
  ],
  solitude: [
    { key: 'ignore',      label: 'Ignoré' },
    { key: 'replie',      label: 'Replié' },
    { key: 'vulnerable',  label: 'Vulnérable' },
  ],

  // DÉGOÛT
  evitement: [
    { key: 'hesitant',    label: 'Hésitant' },
    { key: 'detestable',  label: 'Détestable' },
  ],
  reprobation: [
    { key: 'juge',        label: 'Jugé' },
    { key: 'revolte',     label: 'Révolté' },
  ],
  deception: [
    { key: 'aversion',    label: 'Aversion' },
    { key: 'repugnant',   label: 'Répugnant' },
  ],
  terrible: [
    { key: 'degout',      label: 'Dégoût' },
    { key: 'aversion2',   label: 'Aversion' },
  ],
};



export default function EmotionDetailPage({ params }: { params: { path: string[] } }) {
  const segs = params.path || [];
  const root = (segs[0] as PrimaryKey) || 'joy';
  const level2Key = segs[1];
  const level3Key = segs[2];
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const theme = PRIMARY[root] ?? PRIMARY.joy;
  const backHref =
    segs.length <= 1 ? '/exercice/emotions' : `/exercice/emotions/${segs.slice(0, -1).join('/')}`;

  const items: Item[] = useMemo(() => {
    if (!(root in PRIMARY)) return [];
    if (!level2Key) return CHILDREN[root];
    return GRANDCHILDREN[level2Key] ?? [];
  }, [root, level2Key]);

  const title = (() => {
    if (!level2Key) return `Sous-émotions : ${theme.label}`;
    if (!level3Key) return `Affiner : ${labelOf(level2Key)} (${theme.label})`;
    return `Tu as choisi : ${labelOf(level3Key)}`;
  })();

  function destFor(item: Item) {
    const nextSegs =
      !level2Key ? [root, item.key] : level3Key ? [root, level2Key, item.key] : [root, item.key];
    return `/exercice/emotions/${nextSegs.join('/')}`;
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

  return (
    <main style={styles.page(bg(theme.color))}>
      <header style={styles.header}>
        <BackLink href={backHref} style={styles.back} />
        <h1 style={styles.h1}>{title}</h1>
        <div />
      </header>

      <nav style={styles.crumbs}>
        <a href="/exercice/emotions" style={chip('#fff', '#0f172a')}>Roue</a>
        <span style={{ margin: '0 6px', opacity: .5 }}>›</span>
        <a href={`/exercice/emotions/${root}`} style={chip(theme.color, '#111')}>{PRIMARY[root]?.label ?? root}</a>
        {level2Key && (
          <>
            <span style={{ margin: '0 6px', opacity: .5 }}>›</span>
            <a href={`/exercice/emotions/${root}/${level2Key}`} style={chip('#fff', '#0f172a')}>
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
        <section style={styles.wheelWrap}>
          <svg
            viewBox="-160 -160 320 320"
            style={{ ...styles.svg, width: 'min(420px, 80vw)', height: 'min(420px, 80vw)' }}
            role="group"
            aria-label="Roue des sous-émotions"
          >
            {items.map((it, i) => {
              const s = slices[i];
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
                    x={s.labelPos.x}
                    y={s.labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight={700}
                    fontSize={12}
                    fill="#0f172a"
                    pointerEvents="none"
                  >
                    {it.label}
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
        <a href="/exercice/emotions" style={btnSecondary}>Réinitialiser</a>
        <a
          href="/hyperactivation"
          style={{
            ...btnPlain,
            pointerEvents: pendingKey ? 'none' : undefined,
            opacity: pendingKey ? 0.6 : btnPlain.opacity,
          }}
        >
          Accueil hyperactivation
        </a>
      </footer>
    </main>
  );
}

/* ——— utilitaires visuels ——— */
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
  const all = Object.values(CHILDREN).flat().concat(...Object.values(GRANDCHILDREN));
  return all.find((i) => i.key === key)?.label ?? key;
}

/** ——— géométrie de la roue SVG ——— */
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

    return { path, labelPos };
  });
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }

/* ——— Styles corrigés ——— */
const styles = {
  page: (background: string): React.CSSProperties => ({
    minHeight: '100dvh',
    background,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
    justifyItems: 'center',
    padding: 20,
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
  crumbs: { display: 'flex', alignItems: 'center', gap: 0, margin: '6px 0 12px' } as React.CSSProperties,
  wheelWrap: { position: 'relative', marginTop: 6 } as React.CSSProperties,
  svg: {
    display: 'block',
    borderRadius: '50%',
    boxShadow: '0 12px 28px rgba(0,0,0,.08)',
    background: '#fff',
  } as React.CSSProperties,
  slicePath: { cursor: 'pointer', outline: 'none', transition: 'filter .12s ease' } as React.CSSProperties,
  footer: { display: 'flex', gap: 10, margin: '12px 0 8px' } as React.CSSProperties,
};

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
    boxShadow: '0 4px 10px rgba(0,0,0,.04)',
  };
}

const btnSecondary: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
};
const btnPlain: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid transparent',
  background: 'transparent',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
};
