'use client';

import { useState } from 'react';
import BackLink from '../../components/BackLink';
import { buildApiUrl } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [debugResetLink, setDebugResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setDebugResetLink(null);

    try {
      const res = await fetch(buildApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Demande de réinitialisation impossible.");
      }

      setMsg(
        data.message ||
          "Si un compte existe pour cette adresse, un lien de réinitialisation va être envoyé."
      );
      setDebugResetLink(data.debugResetLink ?? null);
    } catch (error) {
      const err = error as Error;
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

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
        <BackLink href="/login" style={{ background: 'transparent', color: '#111' }} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: 'min(420px, 100%)',
          display: 'grid',
          gap: 12,
          padding: 24,
          borderRadius: 16,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,.06)',
          border: '1px solid #eee',
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Réinitialiser le mot de passe</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Indique ton adresse e-mail pour recevoir un lien de réinitialisation.
        </p>

        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <button type="submit" disabled={busy || !email} style={btnStyle}>
          {busy ? 'Envoi…' : 'Envoyer le lien'}
        </button>

        {msg ? (
          <p style={{ margin: 0, color: msg.includes('impossible') ? '#b91c1c' : '#065f46' }}>{msg}</p>
        ) : null}

        {debugResetLink ? (
          <div
            style={{
              display: 'grid',
              gap: 8,
              padding: 12,
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
              Lien de test local :
            </p>
            <a
              href={debugResetLink}
              style={{ color: '#4f46e5', wordBreak: 'break-all', fontSize: 14, fontWeight: 600 }}
            >
              {debugResetLink}
            </a>
          </div>
        ) : null}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #ddd',
  fontSize: 15,
};

const btnStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #4f46e5',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};
