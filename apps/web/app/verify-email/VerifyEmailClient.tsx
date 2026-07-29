'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackLink from '../../components/BackLink';
import { buildApiUrl } from '../../lib/api';
import { persistAuthenticatedSession } from '../../lib/session';

type VerifyEmailClientProps = {
  token: string;
};

export default function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Validation du lien en cours...');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('Lien de confirmation invalide.');
        return;
      }

      try {
        const res = await fetch(buildApiUrl('/auth/verify-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || 'Confirmation impossible.');
        }

        if (cancelled) return;

        if (data.access_token && data.user) {
          persistAuthenticatedSession(data.user, data.access_token);
        }

        setStatus('success');
        setMessage(data.message || 'Adresse e-mail confirmée.');

        window.setTimeout(() => {
          router.replace('/app');
        }, 900);
      } catch (error) {
        if (cancelled) return;
        const err = error as Error;
        setStatus('error');
        setMessage(err.message || 'Confirmation impossible.');
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#F6F7FE',
        position: 'relative',
        padding: 24,
      }}
    >
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <BackLink href="/" style={{ background: 'transparent', color: '#111' }} />
      </div>

      <section
        style={{
          width: 'min(420px, 100%)',
          display: 'grid',
          gap: 16,
          padding: 28,
          borderRadius: 18,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,.06)',
          border: '1px solid #eee',
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Confirmation du compte</h1>
        <p style={{ margin: 0, color: status === 'error' ? '#b91c1c' : status === 'success' ? '#065f46' : '#475569' }}>
          {message}
        </p>

        {status === 'loading' ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Merci de patienter quelques secondes.</p>
        ) : null}

        {status === 'error' ? (
          <a href="/signup" style={linkButtonStyle}>
            Revenir à l'inscription
          </a>
        ) : null}

        {status === 'success' ? (
          <a href="/app" style={linkButtonStyle}>
            Continuer
          </a>
        ) : null}
      </section>
    </main>
  );
}

const linkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 46,
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #4f46e5',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
};
