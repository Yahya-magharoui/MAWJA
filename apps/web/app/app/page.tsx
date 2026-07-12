'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink';
import DoctorDashboard from '../../components/DoctorDashboard';
import PatientAssignmentCard from '../../components/PatientAssignmentCard';
import { getStoredThemeColor, setThemeColor, tintColor, withAlpha } from '../../components/theme';
import type { Lang } from '../../i18n';
import { DOCTOR_EXPERIENCE_ENABLED } from '../../lib/features';
import { postHistoryEntry, type HistoryState } from '../../lib/patientTracking';
import { clearSession, type AccountStatus, type UserRole, useSessionInfo } from '../../lib/session';

const PRESET = ['#A78BFA', '#93C5FD', '#A7F3D0', '#FDE68A', '#F9A8D4', '#D1D5DB'];
const STATE_OPTIONS: Array<{ value: HistoryState; label: string; description: string }> = [
  {
    value: 'HYPER',
    label: 'Hyperactivation',
    description: 'Tension, agitation, accélération.',
  },
  {
    value: 'TOLERANCE',
    label: 'Fenêtre de tolérance',
    description: 'Équilibre, présence, stabilité.',
  },
  {
    value: 'HYPO',
    label: 'Hypoactivation',
    description: 'Ralenti, engourdi, déconnecté.',
  },
];

export default function AppHome() {
  const session = useSessionInfo();
  const [color, setColor] = useState(PRESET[0]);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openLogoutCheckin, setOpenLogoutCheckin] = useState(false);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
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
      shadow: `0 12px 28px ${withAlpha(color, 0.35)}`,
    },
    window: {
      bg: `linear-gradient(180deg, ${tintColor(color, 0.45)} 0%, ${tintColor(color, 0.22)} 100%)`,
      shadow: `0 10px 22px ${withAlpha(color, 0.3)}`,
    },
    hypo: {
      bg: `linear-gradient(180deg, ${tintColor(color, 0.72)} 0%, ${tintColor(color, 0.48)} 100%)`,
      shadow: `0 8px 18px ${withAlpha(color, 0.25)}`,
    },
  }), [color]);

  const accountStatus: AccountStatus = session?.status ?? 'guest';
  const role: UserRole | null = session?.role ?? null;
  const accountEmail = session?.profile?.email ?? null;
  const accountName = session?.profile?.name ?? null;
  const isDoctor = DOCTOR_EXPERIENCE_ENABLED && role === 'DOCTOR' && accountStatus === 'registered';
  const hasDoctorAccount = role === 'DOCTOR' && accountStatus === 'registered';
  const isAuthenticatedPatient = role === 'PATIENT' && accountStatus === 'registered';
  const screenTitle = isDoctor
    ? 'Dashboard medecin'
    : hasDoctorAccount
      ? 'Espace médecin'
      : 'Comment te sens-tu maintenant ?';

  function handleLogout() {
    if (isAuthenticatedPatient) {
      setOpenAssignmentModal(false);
      setOpenSettings(false);
      setOpenLogoutCheckin(true);
      setLogoutError(null);
      return;
    }

    clearSession();
    setOpenAssignmentModal(false);
    setOpenLogoutCheckin(false);
    setOpenSettings(false);
    window.location.replace('/login');
  }

  function handleStateSelection(_: HistoryState, href: string) {
    if (selectionBusy) return;

    setSelectionBusy(true);
    window.location.href = href;
  }

  function finalizeLogout() {
    clearSession();
    setOpenAssignmentModal(false);
    setOpenSettings(false);
    setOpenLogoutCheckin(false);
    setLogoutBusy(false);
    window.location.replace('/login');
  }

  async function tryLogLogoutState(state: HistoryState) {
    await Promise.race([
      postHistoryEntry(state),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]);
  }

  async function handleLogoutStateSelection(state: HistoryState) {
    if (logoutBusy) return;

    setLogoutBusy(true);
    setLogoutError(null);

    try {
      await tryLogLogoutState(state);
    } catch (error) {
      console.error(error);
    } finally {
      finalizeLogout();
    }
  }

  function handleLogoutLater() {
    if (logoutBusy) return;
    finalizeLogout();
  }

  return (
    <main style={styles.page(theme.bg)}>
      <style>{css}</style>

      <header style={styles.header}>
        <BackLink href="/" style={styles.backBtn} aria-label="Retour à l’accueil" />
        <h1 style={styles.h1}>{screenTitle}</h1>
        <button
          style={styles.gearBtn}
          aria-label="Paramètres"
          title="Paramètres"
          onClick={() => setOpenSettings(true)}
        >
          ⚙️
        </button>
      </header>

      {isDoctor ? (
        <DoctorDashboard themeColor={color} profile={session?.profile ?? null} />
      ) : hasDoctorAccount ? (
        <section className="fade-in" style={styles.disabledDoctorShell}>
          <div style={styles.disabledDoctorCard}>
            <p style={styles.disabledDoctorEyebrow}>Bientôt disponible</p>
            <h2 style={styles.disabledDoctorTitle}>L’espace médecin est temporairement masqué avant le déploiement.</h2>
            <p style={styles.disabledDoctorText}>
              La partie médecin n’est pas encore prête pour cette version publique. Tu peux te déconnecter depuis les paramètres.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="fade-in" style={styles.stack}>
            <Card
              title="Hyperactivation"
              caption="Fuite/lutte, rythme cardiaque rapide, irritabilité, respiration rapide, tension musculaire, sueurs, palpitations, colère, anxiété, agitation, hypervigilance"
              styleExtra={{ ...styles.top, background: theme.hyper.bg, boxShadow: theme.hyper.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('HYPER', '/hyperactivation')}
            />
            <Card
              title="Fenêtre de tolérance"
              caption="Fenêtre d’activation optimale, équilibre, calme, attentif"
              styleExtra={{ background: theme.window.bg, boxShadow: theme.window.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('TOLERANCE', '/tolerance')}
            />
            <Card
              title="Hypoactivation"
              caption="Paralysie, sensation de déconnexion, d’engourdissement, digestion perturbée, respiration impactée, déréalisation, apathie, retrait, confusion"
              styleExtra={{ ...styles.bottom, background: theme.hypo.bg, boxShadow: theme.hypo.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('HYPO', '/hypoactivation')}
            />
          </section>

          <nav className="float-up" style={styles.actions}>
            <button style={styles.secondary} onClick={() => (window.location.href = '/sos?from=app')}>
              J’ai besoin d’aide
            </button>
          </nav>

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
        </>
      )}

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
                <div style={{ fontWeight: 600 }}>{accountName ?? 'Compte'}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {accountStatus === 'registered'
                    ? [role === 'DOCTOR' ? 'Docteur' : 'Patient', accountEmail].filter(Boolean).join(' · ')
                    : 'Mode invite patient'}
                </div>
              </div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                {accountStatus === 'registered' ? 'Connecté' : 'Invité'}
              </span>
            </button>

            {accountStatus === 'registered' && (
              <button style={{ ...styles.settingRow, color: '#b91c1c' }} onClick={handleLogout}>
                <span style={styles.settingIcon}>🚪</span>
                <div style={{ flex: 1 }}>Se déconnecter</div>
                <span aria-hidden>›</span>
              </button>
            )}

            {DOCTOR_EXPERIENCE_ENABLED && isAuthenticatedPatient && (
              <button
                style={styles.settingRow}
                onClick={() => {
                  setOpenSettings(false);
                  setOpenAssignmentModal(true);
                }}
              >
                <span style={styles.settingIcon}>🩺</span>
                <div style={{ flex: 1 }}>Affectation à un médecin</div>
                <span aria-hidden>›</span>
              </button>
            )}

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

            <button style={styles.settingRow} onClick={() => setReadingEnabled((v) => !v)}>
              <span style={styles.settingIcon}>🔊</span>
              <div>Lecture des consignes</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{readingEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button style={styles.settingRow} onClick={() => setHapticsEnabled((v) => !v)}>
              <span style={styles.settingIcon}>📳</span>
              <div>Retour haptique</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{hapticsEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button style={styles.settingRow} onClick={() => setSoundEnabled((v) => !v)}>
              <span style={styles.settingIcon}>🎵</span>
              <div>Effet sonore</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{soundEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
          </div>
        </div>
      )}

      {DOCTOR_EXPERIENCE_ENABLED && openAssignmentModal && isAuthenticatedPatient && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
          <div style={styles.assignmentModalCard}>
            <button onClick={() => setOpenAssignmentModal(false)} style={styles.closeBtn} aria-label="Fermer">✕</button>
            <div style={{ marginBottom: 10 }}>
              <p style={styles.assignmentEyebrow}>Suivi</p>
              <h2 id="assignment-modal-title" style={styles.assignmentTitle}>Affectation à un médecin</h2>
            </div>
            <PatientAssignmentCard
              themeColor={color}
              profile={session?.profile ?? null}
              authenticated={isAuthenticatedPatient}
              embedded
            />
          </div>
        </div>
      )}

      {openLogoutCheckin && isAuthenticatedPatient && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true" aria-labelledby="logout-checkin-title">
          <div style={styles.logoutModalCard}>
            <button onClick={() => setOpenLogoutCheckin(false)} style={styles.closeBtn} aria-label="Fermer">✕</button>
            <div style={{ marginBottom: 8 }}>
              <p style={styles.assignmentEyebrow}>Avant la déconnexion</p>
              <h2 id="logout-checkin-title" style={styles.assignmentTitle}>Comment tu te sens maintenant ?</h2>
              <p style={styles.logoutDescription}>Choisis ton état pour l’ajouter à l’historique avant de te déconnecter.</p>
            </div>

            <div style={styles.logoutOptions}>
              {STATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void handleLogoutStateSelection(option.value)}
                  disabled={logoutBusy}
                  style={styles.logoutOptionButton}
                >
                  <span style={styles.logoutOptionLabel}>{option.label}</span>
                  <span style={styles.logoutOptionDescription}>{option.description}</span>
                </button>
              ))}
            </div>

            <div style={styles.logoutActions}>
              <button
                type="button"
                onClick={handleLogoutLater}
                disabled={logoutBusy}
                style={styles.logoutLaterButton}
              >
                Plus tard
              </button>
            </div>

            {logoutError ? <p style={styles.logoutError}>{logoutError}</p> : null}
          </div>
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  caption,
  styleExtra,
  disabled = false,
  onClick,
}: {
  title: string;
  caption: string;
  styleExtra?: React.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={title}
      aria-disabled={disabled}
      style={{ ...styles.card, ...(disabled ? styles.cardDisabled : null), ...styleExtra }}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div style={styles.cardInner}>
        <h2 style={styles.cardTitle}>{title}</h2>
        <p style={styles.cardCaption}>{caption}</p>
      </div>
    </article>
  );
}

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
    justifySelf: 'start',
  } as React.CSSProperties,
  h1: { margin: 0, fontSize: 18, textAlign: 'center', letterSpacing: 0.2 } as React.CSSProperties,
  gearBtn: {
    justifySelf: 'end',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 12,
    padding: '8px 10px',
    cursor: 'pointer',
  } as React.CSSProperties,
  stack: { display: 'grid', gap: 14, padding: '6px 20px 14px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,
  disabledDoctorShell: { display: 'grid', alignContent: 'start', padding: '24px 20px', maxWidth: 720, margin: '0 auto', width: '100%' } as React.CSSProperties,
  disabledDoctorCard: {
    background: '#fff',
    borderRadius: 24,
    border: '1px solid rgba(15,23,42,.08)',
    boxShadow: '0 18px 36px rgba(15,23,42,.08)',
    padding: '28px 24px',
  } as React.CSSProperties,
  disabledDoctorEyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7c3aed',
  } as React.CSSProperties,
  disabledDoctorTitle: { margin: '10px 0 8px', fontSize: 24, lineHeight: 1.2, color: '#0f172a' } as React.CSSProperties,
  disabledDoctorText: { margin: 0, fontSize: 15, lineHeight: 1.6, color: '#475569' } as React.CSSProperties,
  card: {
    borderRadius: 22,
    border: '1px solid rgba(0,0,0,.04)',
    padding: 0,
    outlineOffset: 4,
    transition: 'transform .2s ease, box-shadow .2s ease',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardDisabled: {
    opacity: 0.7,
    cursor: 'wait',
  } as React.CSSProperties,
  top: { borderTopLeftRadius: 120, borderTopRightRadius: 120 } as React.CSSProperties,
  bottom: { borderBottomLeftRadius: 120, borderBottomRightRadius: 120 } as React.CSSProperties,
  cardInner: { padding: '26px 18px', textAlign: 'center' } as React.CSSProperties,
  cardTitle: { margin: 0, fontWeight: 700, fontSize: 16, letterSpacing: 0.4 } as React.CSSProperties,
  cardCaption: { margin: '6px 0 2px', fontSize: 13, opacity: 0.7 } as React.CSSProperties,
  actions: { display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', maxWidth: 520, margin: '4px auto 10px', padding: '0 20px', width: '100%' } as React.CSSProperties,
  secondary: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  footer: { padding: '6px 20px 18px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,
  subtle: { fontSize: 12, opacity: 0.7, display: 'inline-block', marginBottom: 6 } as React.CSSProperties,
  bubbles: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as React.CSSProperties,
  bubble: { width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(0,0,0,.06)', cursor: 'pointer' } as React.CSSProperties,
  hexWrap: { marginLeft: 4 } as React.CSSProperties,
  hexInput: { width: 110, padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' } as React.CSSProperties,
  settingsOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 50 } as React.CSSProperties,
  settingsCard: { width: 'min(420px,100%)', background: '#fff', borderRadius: 24, padding: '22px 12px 12px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  assignmentModalCard: { width: 'min(520px,100%)', background: '#fff', borderRadius: 24, padding: '22px 18px 18px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  logoutModalCard: { width: 'min(560px,100%)', background: '#fff', borderRadius: 24, padding: '22px 18px 18px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  closeBtn: { position: 'absolute', right: 12, top: 12, border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' } as React.CSSProperties,
  settingRow: { display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'left' } as React.CSSProperties,
  settingIcon: { width: 28, textAlign: 'center', fontSize: 18 } as React.CSSProperties,
  settingSection: { padding: '6px 8px', borderRadius: 14, border: '1px solid rgba(0,0,0,.04)', background: '#fafaff', margin: '4px 0 6px' } as React.CSSProperties,
  sectionTitle: { fontWeight: 600, fontSize: 13, marginBottom: 6 } as React.CSSProperties,
  assignmentEyebrow: { margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' } as React.CSSProperties,
  assignmentTitle: { margin: '6px 0 0', fontSize: 24, color: '#0f172a' } as React.CSSProperties,
  logoutDescription: { margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#475569' } as React.CSSProperties,
  logoutOptions: { display: 'grid', gap: 12 } as React.CSSProperties,
  logoutActions: { display: 'flex', justifyContent: 'flex-end', marginTop: 14 } as React.CSSProperties,
  logoutOptionButton: {
    textAlign: 'left',
    border: '1px solid #e2e8f0',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 20,
    padding: '16px 18px',
    cursor: 'pointer',
    display: 'grid',
    gap: 4,
  } as React.CSSProperties,
  logoutOptionLabel: { fontSize: 17, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
  logoutOptionDescription: { fontSize: 14, color: '#64748b' } as React.CSSProperties,
  logoutLaterButton: {
    border: '1px solid #dbe1f0',
    background: '#f8fafc',
    color: '#334155',
    borderRadius: 999,
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
  logoutError: { margin: '14px 0 0', color: '#b91c1c', fontSize: 14 } as React.CSSProperties,
  langRow: { display: 'flex', gap: 8 } as React.CSSProperties,
  langBtn: { flex: 1, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,.08)', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
} as const;

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
