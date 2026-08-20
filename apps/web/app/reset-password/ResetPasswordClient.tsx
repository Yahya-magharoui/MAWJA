'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackLink from '../../components/BackLink';
import { buildApiUrl } from '../../lib/api';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '12345678910',
  '123456789123456',
  'azerty123456',
  'azertyuiop',
  'password',
  'password123',
  'password1234',
  'qwerty123',
  'qwertyuiop',
  'motdepasse',
  'motdepasse123',
  'admin123456',
  'welcome123',
  'letmein123',
  'bonjour123',
]);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validatePassword(rawPassword: string, rawEmail = '') {
  const normalizedPassword = rawPassword.trim();
  const normalizedEmail = normalizeEmail(rawEmail);
  const localPart = normalizedEmail.split('@')[0] || '';
  const loweredPassword = normalizedPassword.toLowerCase();

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (normalizedPassword.length > MAX_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au maximum ${MAX_PASSWORD_LENGTH} caractères.`;
  }

  if (COMMON_PASSWORDS.has(loweredPassword)) {
    return 'Choisis un mot de passe moins courant.';
  }

  if (localPart && loweredPassword.includes(localPart)) {
    return "Le mot de passe ne doit pas contenir ton adresse e-mail.";
  }

  if (loweredPassword.includes('mawja')) {
    return "Le mot de passe ne doit pas contenir le nom de l'application.";
  }

  if (/^(.)\1{7,}$/.test(normalizedPassword)) {
    return 'Le mot de passe est trop prévisible.';
  }

  return null;
}

type ResetPasswordClientProps = {
  token: string;
};

export default function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg('Lien de réinitialisation invalide.');
      return;
    }

    const passwordValidationMessage = validatePassword(password);
    if (passwordValidationMessage) {
      setMsg(passwordValidationMessage);
      return;
    }

    if (password !== confirmPassword) {
      setMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);

    try {
      const res = await fetch(buildApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Réinitialisation impossible.');
      }

      setSuccess(true);
      setMsg(data.message || 'Mot de passe réinitialisé avec succès.');

      window.setTimeout(() => {
        router.replace('/login');
      }, 900);
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
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Nouveau mot de passe</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Choisis un nouveau mot de passe pour ton compte.
        </p>

        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {password ? (
          <p
            style={{
              margin: '-4px 2px 0',
              fontSize: 13,
              color: validatePassword(password) ? '#b91c1c' : '#065f46',
            }}
          >
            {validatePassword(password) || 'Mot de passe acceptable.'}
          </p>
        ) : null}

        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        {confirmPassword ? (
          <p
            style={{
              margin: '-4px 2px 0',
              fontSize: 13,
              color: password === confirmPassword ? '#065f46' : '#b91c1c',
            }}
          >
            {password === confirmPassword
              ? 'Les mots de passe correspondent.'
              : 'Les mots de passe ne correspondent pas.'}
          </p>
        ) : null}

        <button type="submit" disabled={busy || !token} style={btnStyle}>
          {busy ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
        </button>

        {msg ? (
          <p style={{ margin: 0, color: success ? '#065f46' : '#b91c1c' }}>{msg}</p>
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
