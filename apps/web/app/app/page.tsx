'use client';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink';
import { getStoredThemeColor, setThemeColor, tintColor, withAlpha } from '../../components/theme';
import type { Lang } from '../../i18n';

const PRESET = ['#A78BFA', '#93C5FD', '#A7F3D0', '#FDE68A', '#F9A8D4', '#D1D5DB'];

export default function AppHome() {
  // thème
  const [color, setColor] = useState(PRESET[0]);
  const [openSettings, setOpenSettings] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'registered' | 'guest'>('guest');
  const [readingEnabled, setReadingEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('readingEnabled') !== 'false';
  });
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('hapticsEnabled') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('soundEnabled') !== 'false';
  });
  const [language, setLanguage] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'fr';
    return (window.localStorage.getItem('lang') as Lang) || 'fr';
  });

  useLayoutEffect(() => {
    setColor(getStoredThemeColor());
    if (typeof window !== 'undefined') {
      const status = window.localStorage.getItem('accountStatus');
      setAccountStatus(status === 'registered' ? 'registered' : 'guest');
    }
  }, []);
  useEffect(() => {
    setThemeColor(color);
  }, [color]);
  useEffect(() => { window.localStorage.setItem('readingEnabled', String(readingEnabled)); }, [readingEnabled]);
  useEffect(() => { window.localStorage.setItem('hapticsEnabled', String(hapticsEnabled)); }, [hapticsEnabled]);
  useEffect(() => { window.localStorage.setItem('soundEnabled', String(soundEnabled)); }, [soundEnabled]);

  const theme = useMemo(() => ({
    bg: `radial-gradient(1200px 800px at 50% -10%, ${tintColor(color, 0.82)} 0%, #F6F7FE 55%)`,
    hyper: {
      bg: `linear-gradient(180deg, ${tintColor(color, 0.25)} 0%, ${tintColor(color, 0.06)} 100%)`,
      shadow: `0 12px 28px ${withAlpha(color, 0.35)}`
    },
    window: {
      bg: `linear-gradient(180deg, ${tintColor(color, 0.45)} 0%, ${tintColor(color, 0.22)} 100%)`,
      shadow: `0 10px 22px ${withAlpha(color, 0.3)}`
    },
    hypo: {
      bg: `linear-gradient(180deg, ${tintColor(color, 0.72)} 0%, ${tintColor(color, 0.48)} 100%)`,
      shadow: `0 8px 18px ${withAlpha(color, 0.25)}`
    }
  }), [color]);

  return (
    <main style={styles.page(theme.bg)}>
      <style>{css}</style>

      {/* barre de haut minimaliste */}
      <header style={styles.header}>
        <BackLink href="/" style={styles.backBtn} aria-label="Retour à l’accueil" />
        <h1 style={styles.h1}>Comment te sens-tu maintenant&nbsp;?</h1>
        <button
          style={styles.gearBtn}
          aria-label="Paramètres"
          title="Paramètres"
          onClick={() => setOpenSettings(true)}
        >
          ⚙️
        </button>
      </header>

      {/* cartes — moins de texte, larges et respirantes */}
      <section className="fade-in" style={styles.stack}>
        <Card
          title="Hyperactivation"
          caption="Fuite/lutte, rythme cardiaque rapide, irritabilité, respiration rapide, tension musculaire, sueurs, palpitations, colère, anxiété, agitation, hypervigilance"
          styleExtra={{ ...styles.top, background: theme.hyper.bg, boxShadow: theme.hyper.shadow }}
          onClick={() => (window.location.href = '/hyperactivation')}
        />
        <Card
          title="Fenêtre de tolérance"
          caption="Fenêtre d’activation optimale, équilibre, calme, attentif"
          styleExtra={{ background: theme.window.bg, boxShadow: theme.window.shadow }}
          onClick={() => (window.location.href = '/tolerance')}
        />
        <Card
          title="Hypoactivation"
          caption="Paralysie, sensation de déconnexion, d’engourdissement, digestion perturbée, respiration impactée, déréalisation, apathie, retrait, confusion"
          styleExtra={{ ...styles.bottom, background: theme.hypo.bg, boxShadow: theme.hypo.shadow }}
          onClick={() => (window.location.href = '/hypoactivation')}
        />
      </section>

      {/* actions claires et calmes */}
      <nav className="float-up" style={styles.actions}>
        <button style={styles.secondary} onClick={() => (window.location.href = '/sos')}>
          J’ai besoin d’aide
        </button>
      </nav>

      {/* choix de thème doux */}
      <footer className="float-up" style={styles.footer}>
        <span style={styles.subtle}>Couleur du thème</span>
        <div style={styles.bubbles}>
          {PRESET.map((c) => (
            <button
              key={c}
              aria-label={`Choisir ${c}`}
              style={{ ...styles.bubble, background: c, outline: color === c ? '3px solid rgba(0,0,0,.12)' : 'none' }}
              onClick={() => setColor(c)}
            />
          ))}
          <label style={styles.hexWrap}>
            <span className="sr-only">Choisir une couleur</span>
            <input
              type="text"
              inputMode="text"
              placeholder="#7C3AED"
              aria-label="Code couleur hexadécimal"
              onKeyDown={(e) => {
                const el = e.currentTarget;
                if (e.key === 'Enter') {
                  const v = el.value.trim();
                  if (/^#?[0-9a-f]{6}$/i.test(v)) {
                    setColor(v.startsWith('#') ? v : `#${v}`);
                    el.value = '';
                  }
                }
              }}
              style={styles.hexInput}
            />
          </label>
        </div>
      </footer>

      {openSettings && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true">
          <div style={styles.settingsCard}>
            <button onClick={() => setOpenSettings(false)} style={styles.closeBtn} aria-label="Fermer">✕</button>

            <button
              style={styles.settingRow}
              onClick={() => (window.location.href = accountStatus === 'registered' ? '/app' : '/login')}
            >
              <span style={styles.settingIcon}>👤</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Compte</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{accountStatus === 'registered' ? 'Profil synchronisé' : 'Connecte-toi pour sauvegarder'}</div>
              </div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{accountStatus === 'registered' ? 'Enregistré' : 'Non connecté'}</span>
            </button>

            <button style={styles.settingRow} onClick={() => (window.location.href = '/about')}>
              <span style={styles.settingIcon}>ℹ️</span>
              <div>À propos</div>
              <span aria-hidden>›</span>
            </button>

            <div style={styles.settingSection}>
              <div style={styles.sectionTitle}>Personnaliser le thème</div>
              <div style={styles.bubbles}>
                {PRESET.map((c) => (
                  <button
                    key={`modal-${c}`}
                    aria-label={`Choisir ${c}`}
                    style={{ ...styles.bubble, background: c, outline: color === c ? '3px solid rgba(0,0,0,.12)' : 'none' }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.settingSection}>
              <div style={styles.sectionTitle}>Langue</div>
              <div style={styles.langRow}>
                {(['fr', 'en'] as Lang[]).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => {
                      setLanguage(lng);
                      window.localStorage.setItem('lang', lng);
                      window.location.reload();
                    }}
                    style={{ ...styles.langBtn, background: language === lng ? 'var(--theme-color)' : '#f5f5f5', color: language === lng ? '#fff' : '#111' }}
                  >
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button style={styles.settingRow} onClick={() => setReadingEnabled(v => !v)}>
              <span style={styles.settingIcon}>🔊</span>
              <div>Lecture des consignes</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{readingEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button style={styles.settingRow} onClick={() => setHapticsEnabled(v => !v)}>
              <span style={styles.settingIcon}>📳</span>
              <div>Retour haptique</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{hapticsEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button style={styles.settingRow} onClick={() => setSoundEnabled(v => !v)}>
              <span style={styles.settingIcon}>🎵</span>
              <div>Effet sonore</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{soundEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>

            <button style={styles.settingRow} onClick={() => (window.location.href = '/help')}>
              <span style={styles.settingIcon}>❓</span>
              <div>Aide</div>
              <span aria-hidden>›</span>
            </button>
            <button style={styles.settingRow} onClick={() => (window.location.href = '/privacy')}>
              <span style={styles.settingIcon}>🛡️</span>
              <div>Politique de confidentialité</div>
              <span aria-hidden>›</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ————— Composant Carte ————— */
function Card({
  title,
  caption,
  styleExtra,
  onClick,
}: {
  title: string;
  caption: string;
  styleExtra?: React.CSSProperties;
  onClick?: () => void;        // ← ajouté
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={title}
      style={{ ...styles.card, ...styleExtra }}
      onClick={onClick}        
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.currentTarget as any).click?.()}
    >
      <div style={styles.cardInner}>
        <h2 style={styles.cardTitle}>{title}</h2>
        <p style={styles.cardCaption}>{caption}</p>
      </div>
    </article>
  );
}

/* ————— Styles ————— */
const styles = {
  page: (bg: string): React.CSSProperties => ({
    minHeight: '100dvh',
    background: bg,
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto auto',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
  }),
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    padding: '16px 20px',
  } as React.CSSProperties,
  backBtn: {
    justifySelf: 'start'
  } as React.CSSProperties,
  h1: { margin: 0, fontSize: 18, textAlign: 'center', letterSpacing: .2 } as React.CSSProperties,
  gearBtn: {
    justifySelf: 'end',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 12,
    padding: '8px 10px',
    cursor: 'pointer'
  } as React.CSSProperties,

  stack: { display: 'grid', gap: 14, padding: '6px 20px 14px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,

  card: {
    borderRadius: 22,
    border: '1px solid rgba(0,0,0,.04)',
    padding: 0,
    outlineOffset: 4,
    transition: 'transform .2s ease, box-shadow .2s ease',
    cursor: 'pointer'
  } as React.CSSProperties,
  top: { borderTopLeftRadius: 120, borderTopRightRadius: 120 } as React.CSSProperties,
  bottom: { borderBottomLeftRadius: 120, borderBottomRightRadius: 120 } as React.CSSProperties,
  cardInner: { padding: '26px 18px', textAlign: 'center' } as React.CSSProperties,
  cardTitle: { margin: 0, fontWeight: 700, fontSize: 16, letterSpacing: .4 } as React.CSSProperties,
  cardCaption: { margin: '6px 0 2px', fontSize: 13, opacity: .7 } as React.CSSProperties,

  actions: { display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', maxWidth: 520, margin: '4px auto 10px', padding: '0 20px', width: '100%' } as React.CSSProperties,
  primary: (c: string): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid transparent',
    background: c,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,.08)'
  }),
  secondary: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer'
  } as React.CSSProperties,

  footer: { padding: '6px 20px 18px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,
  subtle: { fontSize: 12, opacity: .7, display: 'inline-block', marginBottom: 6 } as React.CSSProperties,
  bubbles: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as React.CSSProperties,
  bubble: { width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(0,0,0,.06)', cursor: 'pointer' } as React.CSSProperties,
  hexWrap: { marginLeft: 4 } as React.CSSProperties,
  hexInput: { width: 110, padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' } as React.CSSProperties,
  settingsOverlay: { position:'fixed', inset:0, background:'rgba(15,23,42,.35)', display:'grid', placeItems:'center', padding:20, zIndex:50 } as React.CSSProperties,
  settingsCard: { width:'min(420px,100%)', background:'#fff', borderRadius:24, padding:'22px 12px 12px', boxShadow:'0 24px 40px rgba(15,23,42,.25)', display:'grid', gap:4, position:'relative' } as React.CSSProperties,
  closeBtn: { position:'absolute', right:12, top:12, border:'none', background:'transparent', fontSize:20, cursor:'pointer' } as React.CSSProperties,
  settingRow: { display:'flex', alignItems:'center', gap:12, border:'none', background:'transparent', padding:'10px 8px', borderRadius:12, cursor:'pointer', textAlign:'left' } as React.CSSProperties,
  settingIcon: { width:28, textAlign:'center', fontSize:18 } as React.CSSProperties,
  settingSection: { padding:'6px 8px', borderRadius:14, border:'1px solid rgba(0,0,0,.04)', background:'#fafaff', margin:'4px 0 6px' } as React.CSSProperties,
  sectionTitle: { fontWeight:600, fontSize:13, marginBottom:6 } as React.CSSProperties,
  langRow: { display:'flex', gap:8 } as React.CSSProperties,
  langBtn: { flex:1, padding:'8px 10px', borderRadius:12, border:'1px solid rgba(0,0,0,.08)', fontWeight:600, cursor:'pointer' } as React.CSSProperties,
} as const;

/* animations douces + accessibilité */
const css = `
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  @media (prefers-reduced-motion: no-preference) {
    .fade-in{ animation: fade .45s ease-out both }
    .float-up{ animation: up .5s .05s ease-out both }
    article:hover{ transform: translateY(-2px) scale(1.005) }
    article:focus-visible{ outline: 3px solid rgba(0,0,0,.2) }
  }
  @keyframes fade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes up { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
`;
