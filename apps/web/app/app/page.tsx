'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import BackLink from '../../components/BackLink';
import DoctorDashboard from '../../components/DoctorDashboard';
import PatientAssignmentCard from '../../components/PatientAssignmentCard';
import { getStoredThemeColor, setThemeColor, tintColor, withAlpha } from '../../components/theme';
import type { Lang } from '../../i18n';
import { buildApiUrl } from '../../lib/api';
import { DOCTOR_EXPERIENCE_ENABLED } from '../../lib/features';
import { postHistoryEntry, type HistoryState } from '../../lib/patientTracking';
import {
  clearSession,
  persistAuthenticatedSession,
  type AccountStatus,
  type UserRole,
  useSessionInfo,
} from '../../lib/session';

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
  const router = useRouter();
  const session = useSessionInfo();
  const validatedSessionKeyRef = useRef<string | null>(null);
  const [color, setColor] = useState(PRESET[0]);
  const [showStateExplanations, setShowStateExplanations] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [settingsReturnTo, setSettingsReturnTo] = useState<string | null>(null);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openLogoutCheckin, setOpenLogoutCheckin] = useState(false);
  const [openDeleteAccount, setOpenDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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

  useEffect(() => {
    const restoreInteractiveState = () => setSelectionBusy(false);
    window.addEventListener('pageshow', restoreInteractiveState);
    window.addEventListener('focus', restoreInteractiveState);

    return () => {
      window.removeEventListener('pageshow', restoreInteractiveState);
      window.removeEventListener('focus', restoreInteractiveState);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('settings') !== 'open') return;

    const requestedReturnTo = params.get('returnTo');
    if (requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//')) {
      setSettingsReturnTo(requestedReturnTo);
    }
    setOpenSettings(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentProfile = session?.profile ?? null;
    const sessionKey =
      session?.status === 'registered'
        ? `${session.status}:${session.profile?.id ?? 'unknown'}:${session.profile?.email ?? 'unknown'}`
        : null;

    async function validateRegisteredSession() {
      if (!sessionKey) {
        validatedSessionKeyRef.current = null;
        return;
      }

      if (validatedSessionKeyRef.current === sessionKey) {
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/auth/me'), {
          credentials: 'include',
          cache: 'no-store',
        });

        const payload = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) {
            clearSession();
            window.location.replace('/login');
          }
          return;
        }

        if (!response.ok || !payload?.user) {
          return;
        }

        if (cancelled) {
          return;
        }

        validatedSessionKeyRef.current = sessionKey;
        persistAuthenticatedSession({
          ...payload.user,
          email: payload.user.email ?? currentProfile?.email ?? null,
          name: payload.user.name ?? currentProfile?.name ?? null,
          role: payload.user.role === 'DOCTOR' || payload.user.role === 'PATIENT' ? payload.user.role : null,
          loggedInAt: currentProfile?.loggedInAt,
        });
      } catch {
        // Une indisponibilité réseau temporaire ne doit pas déconnecter l'utilisateur.
      }
    }

    void validateRegisteredSession();

    return () => {
      cancelled = true;
    };
  }, [session]);

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

    void finalizeLogout();
  }

  function handleStateSelection(href: string) {
    if (selectionBusy) return;

    setSelectionBusy(true);
    router.push(href as Route);
  }

  function finalizeLogout() {
    void fetch(buildApiUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    }).catch(() => {
      // La session locale doit rester supprimée même si le réseau mobile est indisponible.
    });

    clearSession();
    setOpenAssignmentModal(false);
    setOpenSettings(false);
    setOpenLogoutCheckin(false);
    setLogoutBusy(false);
    router.replace('/login');
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
      void finalizeLogout();
    }
  }

  function handleLogoutLater() {
    if (logoutBusy) return;
    void finalizeLogout();
  }

  function showDeleteAccountConfirmation() {
    setOpenSettings(false);
    setDeleteConfirmation('');
    setDeleteError(null);
    setOpenDeleteAccount(true);
  }

  async function handleDeleteAccount() {
    if (deleteBusy || deleteConfirmation !== 'SUPPRIMER') return;

    setDeleteBusy(true);
    setDeleteError(null);

    try {
      const response = await fetch(buildApiUrl('/auth/account'), {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || 'Impossible de supprimer le compte.');
      }

      clearSession();
      window.location.replace('/');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Impossible de supprimer le compte.');
      setDeleteBusy(false);
    }
  }

  async function handleExportAccount() {
    if (exportBusy) return;

    setExportBusy(true);
    setExportError(null);

    try {
      const response = await fetch(buildApiUrl('/auth/account/export'), {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Impossible d'exporter les données.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `kalymap-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Impossible d'exporter les données.");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <main className="app-home-page" style={styles.page(theme.bg)}>
      <style>{css}</style>

      <header className="app-home-header" style={styles.header}>
        <BackLink href="/" className="app-home-back" style={styles.backBtn} aria-label="Retour à l’accueil" />
        <h1 className="app-home-title" style={styles.h1}>{screenTitle}</h1>
        <button
          className="app-home-gear"
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
          <section className="fade-in app-home-stack" style={styles.stack}>
            <Card
              title="Hyperactivation"
              caption="Fuite/lutte, rythme cardiaque rapide, irritabilité, respiration rapide, tension musculaire, sueurs, palpitations, colère, anxiété, agitation, hypervigilance."
              showCaption={showStateExplanations}
              styleExtra={{ ...styles.top, background: theme.hyper.bg, boxShadow: theme.hyper.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('/hyperactivation')}
            />
            <Card
              title="Fenêtre de tolérance"
              caption="Fenêtre d’activation optimale, équilibre, calme, attentif."
              showCaption={showStateExplanations}
              styleExtra={{ background: theme.window.bg, boxShadow: theme.window.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('/tolerance')}
            />
            <Card
              title="Hypoactivation"
              caption="Paralysie, sensation de déconnexion, d’engourdissement, digestion perturbée, respiration impactée, déréalisation, apathie, retrait, confusion."
              showCaption={showStateExplanations}
              styleExtra={{ ...styles.bottom, background: theme.hypo.bg, boxShadow: theme.hypo.shadow }}
              disabled={selectionBusy}
              onClick={() => handleStateSelection('/hypoactivation')}
            />
          </section>

          <div className="float-up app-home-explanations" style={styles.explanationsRow}>
            <button
              type="button"
              style={styles.globalExplainButton}
              onClick={() => setShowStateExplanations((value) => !value)}
            >
              {showStateExplanations ? 'Masquer les explications' : 'Explications'}
            </button>
          </div>

          <nav className="float-up app-home-actions" style={styles.actions}>
            <button style={styles.secondary} onClick={() => (window.location.href = '/sos?from=app')}>
              J’ai besoin d’aide
            </button>
          </nav>

          <footer className="float-up app-home-footer" style={styles.footer}>
            <span style={styles.subtle}>Couleur du thème</span>
            <div className="theme-bubbles" style={styles.bubbles}>
              {PRESET.map((c) => (
                <button
                  key={c}
                  aria-label={`Choisir ${c}`}
                  style={{ ...styles.bubble, background: c, outline: color === c ? '3px solid rgba(0,0,0,.12)' : 'none' }}
                  onClick={() => setColor(c)}
                />
              ))}
              <label className="theme-hex-wrap" style={styles.hexWrap}>
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
        <div className="settings-overlay" style={styles.settingsOverlay} role="dialog" aria-modal="true">
          <div className="settings-card" style={styles.settingsCard}>
            <button
              onClick={() => {
                if (settingsReturnTo) {
                  window.location.replace(settingsReturnTo);
                  return;
                }
                setOpenSettings(false);
              }}
              style={styles.closeBtn}
              aria-label="Fermer"
            >
              ✕
            </button>

            <button
              className="settings-row"
              style={styles.settingRow}
              onClick={() => (window.location.href = accountStatus === 'registered' ? '/app' : '/login')}
            >
              <span style={styles.settingIcon}>👤</span>
              <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ fontWeight: 600 }}>{accountName ?? 'Compte'}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {accountStatus === 'registered'
                    ? [role === 'DOCTOR' ? 'Docteur' : 'Utilisateur', accountEmail].filter(Boolean).join(' · ')
                    : 'Mode invité'}
                </div>
              </div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                {accountStatus === 'registered' ? 'Connecté' : 'Invité'}
              </span>
            </button>

            {accountStatus === 'registered' && (
              <>
                {isAuthenticatedPatient && (
                  <button className="settings-row" style={styles.settingRow} onClick={() => void handleExportAccount()} disabled={exportBusy}>
                    <span style={styles.settingIcon}>📥</span>
                    <div style={{ flex: 1 }}>{exportBusy ? 'Préparation de l’export…' : 'Exporter mes données'}</div>
                    <span aria-hidden>›</span>
                  </button>
                )}
                <button className="settings-row" style={{ ...styles.settingRow, color: '#b91c1c' }} onClick={handleLogout}>
                  <span style={styles.settingIcon}>🚪</span>
                  <div style={{ flex: 1 }}>Se déconnecter</div>
                  <span aria-hidden>›</span>
                </button>
                <button className="settings-row" style={{ ...styles.settingRow, color: '#991b1b' }} onClick={showDeleteAccountConfirmation}>
                  <span style={styles.settingIcon}>🗑️</span>
                  <div style={{ flex: 1 }}>Supprimer mon compte</div>
                  <span aria-hidden>›</span>
                </button>
              </>
            )}

            {exportError ? <p role="alert" style={styles.settingsError}>{exportError}</p> : null}

            {DOCTOR_EXPERIENCE_ENABLED && isAuthenticatedPatient && (
              <button
                className="settings-row"
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
              <div className="theme-bubbles" style={styles.bubbles}>
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
              <div className="settings-lang-row" style={styles.langRow}>
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

            <button className="settings-row" style={styles.settingRow} onClick={() => setReadingEnabled((v) => !v)}>
              <span style={styles.settingIcon}>🔊</span>
              <div>Lecture des consignes</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{readingEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button className="settings-row" style={styles.settingRow} onClick={() => setHapticsEnabled((v) => !v)}>
              <span style={styles.settingIcon}>📳</span>
              <div>Retour haptique</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{hapticsEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
            <button className="settings-row" style={styles.settingRow} onClick={() => setSoundEnabled((v) => !v)}>
              <span style={styles.settingIcon}>🎵</span>
              <div>Effet sonore</div>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{soundEnabled ? 'Activé' : 'Désactivé'}</span>
            </button>
          </div>
        </div>
      )}

      {DOCTOR_EXPERIENCE_ENABLED && openAssignmentModal && isAuthenticatedPatient && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
          <div className="assignment-modal-card" style={styles.assignmentModalCard}>
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

      {openDeleteAccount && accountStatus === 'registered' && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="delete-account-card" style={styles.deleteAccountCard}>
            <button
              onClick={() => setOpenDeleteAccount(false)}
              style={styles.closeBtn}
              aria-label="Fermer"
              disabled={deleteBusy}
            >
              ✕
            </button>
            <p style={styles.assignmentEyebrow}>Action définitive</p>
            <h2 id="delete-account-title" style={styles.assignmentTitle}>Supprimer mon compte</h2>
            <p style={styles.deleteAccountDescription}>
              Ton compte et les données qui lui sont liées seront supprimés définitivement. Cette action est irréversible.
            </p>
            <label style={styles.deleteAccountLabel}>
              Saisis <strong>SUPPRIMER</strong> pour confirmer
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
                autoComplete="off"
                disabled={deleteBusy}
                style={styles.deleteAccountInput}
              />
            </label>
            {deleteError ? <p role="alert" style={styles.logoutError}>{deleteError}</p> : null}
            <div style={styles.deleteAccountActions}>
              <button type="button" onClick={() => setOpenDeleteAccount(false)} disabled={deleteBusy} style={styles.logoutLaterButton}>
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleteBusy || deleteConfirmation !== 'SUPPRIMER'}
                style={{
                  ...styles.deleteAccountButton,
                  opacity: deleteBusy || deleteConfirmation !== 'SUPPRIMER' ? 0.5 : 1,
                  cursor: deleteBusy || deleteConfirmation !== 'SUPPRIMER' ? 'not-allowed' : 'pointer',
                }}
              >
                {deleteBusy ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {openLogoutCheckin && isAuthenticatedPatient && (
        <div style={styles.settingsOverlay} role="dialog" aria-modal="true" aria-labelledby="logout-checkin-title">
          <div className="logout-modal-card" style={styles.logoutModalCard}>
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
  showCaption = false,
  styleExtra,
  disabled = false,
  onClick,
}: {
  title: string;
  caption?: string;
  showCaption?: boolean;
  styleExtra?: React.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <article
      aria-label={title}
      style={{ ...styles.card, ...(disabled ? styles.cardDisabled : null), ...styleExtra }}
    >
      <div
        role="button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        style={styles.cardInner}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <h2 style={styles.cardTitle}>{title}</h2>
        {caption ? (
          <p style={{ ...styles.cardCaption, visibility: showCaption ? 'visible' : 'hidden' }}>{caption}</p>
        ) : null}
      </div>
    </article>
  );
}

const styles = {
  page: (bg: string): React.CSSProperties => ({
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '100%',
    background: bg,
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto auto',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    overflowX: 'clip',
    paddingLeft: 'max(12px, env(safe-area-inset-left))',
    paddingRight: 'max(12px, env(safe-area-inset-right))',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  }),
  header: {
    width: '100%',
    maxWidth: 680,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '44px minmax(0, 1fr) 44px',
    alignItems: 'center',
    gap: 8,
    padding: '16px 0',
  } as React.CSSProperties,
  backBtn: {
    justifySelf: 'start',
    width: 44,
    height: 44,
  } as React.CSSProperties,
  h1: {
    margin: 0,
    minWidth: 0,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
    overflowWrap: 'anywhere',
  } as React.CSSProperties,
  gearBtn: {
    justifySelf: 'end',
    width: 44,
    height: 44,
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 12,
    padding: 0,
    cursor: 'pointer',
  } as React.CSSProperties,
  stack: { display: 'grid', gap: 14, padding: '6px 0 14px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,
  disabledDoctorShell: { display: 'grid', alignContent: 'start', padding: '24px 0', maxWidth: 720, margin: '0 auto', width: '100%' } as React.CSSProperties,
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
  cardInner: {
    padding: '26px 18px',
    textAlign: 'center',
    outline: 'none',
    minHeight: 154,
    display: 'grid',
    alignContent: 'center',
    gap: 10,
  } as React.CSSProperties,
  cardTitle: { margin: 0, fontWeight: 700, fontSize: 16, letterSpacing: 0.4 } as React.CSSProperties,
  cardCaption: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: 'rgba(15,23,42,.78)',
  } as React.CSSProperties,
  explanationsRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '6px 0 10px',
    maxWidth: 520,
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
  globalExplainButton: {
    border: '1px solid rgba(15,23,42,.12)',
    background: 'linear-gradient(180deg, #B779F2 0%, #A855F7 100%)',
    color: '#111827',
    borderRadius: 999,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(124,58,237,.28)',
  } as React.CSSProperties,
  actions: { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', maxWidth: 520, margin: '4px auto 10px', padding: 0, width: '100%' } as React.CSSProperties,
  secondary: {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  footer: { padding: '6px 0 18px', maxWidth: 520, margin: '0 auto', width: '100%' } as React.CSSProperties,
  subtle: { fontSize: 12, opacity: 0.7, display: 'inline-block', marginBottom: 6 } as React.CSSProperties,
  bubbles: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as React.CSSProperties,
  bubble: { width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(0,0,0,.06)', cursor: 'pointer' } as React.CSSProperties,
  hexWrap: { marginLeft: 4, minWidth: 0 } as React.CSSProperties,
  hexInput: { width: 110, maxWidth: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' } as React.CSSProperties,
  settingsOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', display: 'grid', placeItems: 'center', padding: 'max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))', zIndex: 50 } as React.CSSProperties,
  settingsCard: { width: 'min(420px,100%)', background: '#fff', borderRadius: 24, padding: '22px 12px 12px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  assignmentModalCard: { width: 'min(520px,100%)', background: '#fff', borderRadius: 24, padding: '22px 18px 18px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  logoutModalCard: { width: 'min(560px,100%)', background: '#fff', borderRadius: 24, padding: '22px 18px 18px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 4, position: 'relative' } as React.CSSProperties,
  deleteAccountCard: { width: 'min(520px,100%)', background: '#fff', borderRadius: 24, padding: '24px 20px 20px', boxShadow: '0 24px 40px rgba(15,23,42,.25)', display: 'grid', gap: 14, position: 'relative' } as React.CSSProperties,
  closeBtn: { position: 'absolute', right: 12, top: 12, border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' } as React.CSSProperties,
  settingRow: { display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%', maxWidth: '100%' } as React.CSSProperties,
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
  settingsError: { margin: '4px 8px 8px', color: '#b91c1c', fontSize: 13, lineHeight: 1.4 } as React.CSSProperties,
  deleteAccountDescription: { margin: 0, fontSize: 15, lineHeight: 1.6, color: '#475569' } as React.CSSProperties,
  deleteAccountLabel: { display: 'grid', gap: 8, fontSize: 14, color: '#334155' } as React.CSSProperties,
  deleteAccountInput: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', fontSize: 16 } as React.CSSProperties,
  deleteAccountActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' } as React.CSSProperties,
  deleteAccountButton: { border: 'none', background: '#b91c1c', color: '#fff', borderRadius: 999, padding: '10px 16px', fontWeight: 700 } as React.CSSProperties,
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

  .theme-bubbles{
    width: 100%;
  }

  .theme-hex-wrap{
    min-width: 0;
  }

  .theme-hex-wrap input{
    width: min(110px, 100%);
  }

  @media (max-width: 640px) {
    .app-home-page{
      padding-left: max(10px, env(safe-area-inset-left));
      padding-right: max(10px, env(safe-area-inset-right));
    }

    .app-home-header{
      padding-top: 12px !important;
    }

    .app-home-title {
      font-size: clamp(20px, 5vw, 26px) !important;
      line-height: 1.15;
    }

    article:hover {
      transform: none;
    }

    .app-home-stack{
      gap: 12px !important;
    }

    .app-home-actions,
    .app-home-footer{
      max-width: 100% !important;
    }

    .settings-card{
      padding: 20px 12px 12px !important;
      max-height: min(88dvh, 720px);
      overflow-y: auto;
    }

    .settings-row{
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .settings-lang-row{
      flex-wrap: wrap;
    }

    .assignment-modal-card,
    .delete-account-card,
    .logout-modal-card{
      width: 100% !important;
      max-height: min(88dvh, 760px);
      overflow-y: auto;
      padding: 20px 14px 16px !important;
    }
  }

  @media (max-width: 520px) {
    .app-home-header{
      grid-template-columns: 40px minmax(0, 1fr) 40px !important;
      gap: 6px !important;
    }

    .app-home-actions{
      grid-template-columns: 1fr !important;
    }

    .logout-modal-card h2,
    .delete-account-card h2,
    .assignment-modal-card h2{
      font-size: 22px !important;
      line-height: 1.15 !important;
      overflow-wrap: anywhere;
    }
  }
`;
