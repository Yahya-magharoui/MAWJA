'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { postHistoryEntry, type HistoryState } from '../lib/patientTracking';
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'mawja-state-checkin-last-at';

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

function readLastCheckinAt() {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeLastCheckinAt(timestamp: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String(timestamp));
}

export default function StateCheckinPrompt() {
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEligiblePath(pathname)) {
      setOpen(false);
      setError(null);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scheduleNext = () => {
      const now = Date.now();
      const lastCheckinAt = readLastCheckinAt();
      const remaining = Math.max(FIVE_MINUTES_MS - (now - lastCheckinAt), 0);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        setError(null);
        setOpen(true);
      }, remaining);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  async function submitState(state: HistoryState) {
    setBusy(true);
    setError(null);

    try {
      await postHistoryEntry(state);
      const now = Date.now();
      writeLastCheckinAt(now);
      setOpen(false);
      setError(null);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setOpen(true);
      }, FIVE_MINUTES_MS);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(nextError);
    } finally {
      setBusy(false);
    }
  }

  function dismissForLater() {
    const now = Date.now();
    writeLastCheckinAt(now);
    setOpen(false);
    setError(null);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, FIVE_MINUTES_MS);
  }

  if (!isEligiblePath(pathname) || !open) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="state-checkin-title">
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Check-in</p>
            <h2 id="state-checkin-title" style={titleStyle}>Comment tu te sens maintenant ?</h2>
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
  padding: 20,
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
