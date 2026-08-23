'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { postHistoryEntry, type HistoryState } from '../lib/patientTracking';
import { getAccountStatus, getSessionProfile, getUserRole, isAuthenticatedSession } from '../lib/session';

const LOGIN_PROMPT_KEY = 'mawja-state-checkin-login-prompted-at';
const SESSION_EVENT = 'mawja-session-changed';

const OPTIONS: Array<{ value: HistoryState; label: string; description: string }> = [
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

const HIDDEN_PATHS = new Set(['/login', '/signup', '/health']);

function isEligiblePath(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === '/') return false;
  return !HIDDEN_PATHS.has(pathname);
}

function readLoginPromptMarker() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LOGIN_PROMPT_KEY);
}

function writeLoginPromptMarker(value: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOGIN_PROMPT_KEY, value);
}

function getPromptContext() {
  if (typeof window === 'undefined') {
    return {
      canShowPrompt: false,
      loginMarker: null as string | null,
    };
  }

  const session = getSessionProfile();
  const authenticated = isAuthenticatedSession();
  const role = getUserRole();
  const status = getAccountStatus();

  return {
    canShowPrompt: authenticated && status === 'registered' && role === 'PATIENT',
    loginMarker: session?.loggedInAt ?? null,
  };
}

export default function StateCheckinPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptContext, setPromptContext] = useState(() => getPromptContext());
  const canShowPrompt = promptContext.canShowPrompt;
  const loginMarker = promptContext.loginMarker;

  useEffect(() => {
    const sync = () => setPromptContext(getPromptContext());

    sync();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, []);

  useEffect(() => {
    if (!isEligiblePath(pathname) || !canShowPrompt) {
      setOpen(false);
      setError(null);
      return;
    }

    const hasShownInitialPromptForThisLogin =
      Boolean(loginMarker) && readLoginPromptMarker() === loginMarker;
    const shouldOpenForNewLogin = Boolean(loginMarker) && !hasShownInitialPromptForThisLogin;

    if (shouldOpenForNewLogin) {
      setError(null);
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [pathname, canShowPrompt, loginMarker]);

  async function submitState(state: HistoryState) {
    setBusy(true);
    setError(null);

    try {
      await postHistoryEntry(state);
      if (loginMarker) {
        writeLoginPromptMarker(loginMarker);
      }
      setOpen(false);
      setError(null);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(nextError);
    } finally {
      setBusy(false);
    }
  }

  function dismissForLater() {
    if (loginMarker) {
      writeLoginPromptMarker(loginMarker);
    }
    setOpen(false);
    setError(null);
  }

  if (!isEligiblePath(pathname) || !canShowPrompt || !open) return null;

  return (
    <div className="state-checkin-overlay" style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="state-checkin-title">
      <style>{css}</style>
      <div className="state-checkin-card" style={cardStyle}>
        <div className="state-checkin-header" style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Check-in</p>
            <h2 id="state-checkin-title" className="state-checkin-title" style={titleStyle}>Comment tu te sens maintenant ?</h2>
            <p style={descriptionStyle}>Choisis l’état qui correspond le mieux à ta sensation actuelle.</p>
          </div>
          <button type="button" onClick={dismissForLater} style={laterButtonStyle} disabled={busy}>
            Plus tard
          </button>
        </div>

        <div style={optionsStyle}>
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => submitState(option.value)}
              disabled={busy}
              style={optionButtonStyle}
            >
              <span style={optionLabelStyle}>{option.label}</span>
              <span style={optionDescriptionStyle}>{option.description}</span>
            </button>
          ))}
        </div>

        {error ? <p style={errorStyle}>{error}</p> : null}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.36)',
  backdropFilter: 'blur(6px)',
  display: 'grid',
  placeItems: 'center',
  padding: 'max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
  zIndex: 1000,
};

const cardStyle: CSSProperties = {
  width: 'min(100%, 560px)',
  background: '#ffffff',
  borderRadius: 28,
  padding: 24,
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 20,
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#7c3aed',
};

const titleStyle: CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 28,
  lineHeight: 1.1,
  color: '#0f172a',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.5,
  color: '#475569',
};

const laterButtonStyle: CSSProperties = {
  border: '1px solid #dbe1f0',
  background: '#f8fafc',
  color: '#334155',
  borderRadius: 999,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 600,
  flexShrink: 0,
};

const optionsStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const optionButtonStyle: CSSProperties = {
  textAlign: 'left',
  border: '1px solid #e2e8f0',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: 20,
  padding: '16px 18px',
  cursor: 'pointer',
  display: 'grid',
  gap: 4,
};

const optionLabelStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#0f172a',
};

const optionDescriptionStyle: CSSProperties = {
  fontSize: 14,
  color: '#64748b',
};

const errorStyle: CSSProperties = {
  margin: '14px 0 0',
  color: '#b91c1c',
  fontSize: 14,
};

const css = `
  @media (max-width: 640px){
    .state-checkin-card{
      padding: 20px 16px !important;
      border-radius: 24px !important;
      max-height: min(88dvh, 760px);
      overflow-y: auto;
    }

    .state-checkin-header{
      flex-direction: column;
      align-items: stretch;
    }

    .state-checkin-title{
      font-size: clamp(22px, 6vw, 28px) !important;
      overflow-wrap: anywhere;
    }

    .state-checkin-header button,
    .state-checkin-card button{
      width: 100%;
    }
  }
`;
