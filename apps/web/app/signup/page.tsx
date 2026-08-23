'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackLink from '../../components/BackLink';
import { buildApiUrl } from '../../lib/api';
import { DOCTOR_EXPERIENCE_ENABLED } from '../../lib/features';
import { isAuthenticatedSession, persistAuthenticatedSession, type UserRole } from '../../lib/session';

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

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState<UserRole>('PATIENT');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  useEffect(() => {
    if (isAuthenticatedSession()) {
      router.replace('/app');
    }
  }, [router]);

  function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
  }

  function validatePassword(rawPassword: string, rawEmail: string) {
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

    if (!/[A-ZÀ-ÖØ-Ý]/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins une majuscule.';
    }

    if (!/\d/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins un chiffre.';
    }

    if (!/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(normalizedPassword)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial.';
    }

    if (COMMON_PASSWORDS.has(loweredPassword)) {
      return 'Choisis un mot de passe moins courant.';
    }

    if (localPart && loweredPassword.includes(localPart)) {
      return "Le mot de passe ne doit pas contenir ton adresse e-mail.";
    }

    if (loweredPassword.includes('kalymap')) {
      return "Le mot de passe ne doit pas contenir le nom de l'application.";
    }

    if (/^(.)\1{7,}$/.test(normalizedPassword)) {
      return 'Le mot de passe est trop prévisible.';
    }

    return null;
  }

  async function checkEmailAvailability(rawEmail: string) {
    const normalizedEmail = normalizeEmail(rawEmail);

    if (!normalizedEmail) {
      setEmailHint(null);
      setEmailAvailable(null);
      return true;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailHint('Adresse e-mail invalide.');
      setEmailAvailable(false);
      return false;
    }

    try {
      const res = await fetch(buildApiUrl('/auth/check-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json().catch(() => ({}));
      const available = Boolean(data.available);
      setEmailAvailable(available);
      setEmailHint(
        data.message || (available ? 'Adresse e-mail disponible.' : 'Cette adresse e-mail est déjà utilisée.')
      );
      return available;
    } catch {
      setEmailHint('Impossible de vérifier cette adresse pour le moment.');
      setEmailAvailable(null);
      return true;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      setEmailAvailable(false);
      setEmailHint('Adresse e-mail invalide.');
      setMsg('Vérifie ton adresse e-mail.');
      return;
    }

    const passwordValidationMessage = validatePassword(password, normalizedEmail);
    if (passwordValidationMessage) {
      setMsg(passwordValidationMessage);
      return;
    }

    if (password !== confirmPassword) {
      setMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);
    setAwaitingVerification(false);

    try {
      const available = await checkEmailAvailability(normalizedEmail);
      if (!available) {
        throw new Error('Cette adresse e-mail est déjà utilisée.');
      }

      const res = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, confirmPassword, role }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Création impossible. Essaie avec une autre adresse.');
      }

      if (data.requiresEmailVerification) {
        setEmailHint(null);
        setEmailAvailable(null);
        setAwaitingVerification(true);
        setMsg(data.message || "Un e-mail de confirmation vient d'être envoyé.");
        return;
      }

      const profile = data.user ?? {
        email: normalizedEmail,
        role,
        createdAt: new Date().toISOString(),
      };

      persistAuthenticatedSession(
        {
          ...profile,
          email: profile.email ?? normalizedEmail,
          role: profile.role === 'DOCTOR' || profile.role === 'PATIENT' ? profile.role : role,
        },
        data.access_token
      );

      setEmailHint(null);
      setEmailAvailable(null);
      setMsg('Compte créé ✅');
      setTimeout(() => {
        router.replace('/app');
      }, 600);
    } catch (error) {
      const err = error as Error;
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#F6F7FE', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <BackLink href="/" style={{ background: 'transparent', color: '#111' }} />
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 'min(420px, calc(100% - 32px))',
          display: 'grid',
          gap: 12,
          padding: 24,
          borderRadius: 16,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,.06)',
          border: '1px solid #eee',
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Créer un compte</h1>
        {DOCTOR_EXPERIENCE_ENABLED ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={labelStyle}>Je suis</span>
            <div style={roleGroupStyle}>
              <button
                type="button"
                onClick={() => undefined}
                style={roleButtonStyle(role === 'PATIENT')}
              >
                Utilisateur
              </button>
              <button
                type="button"
                onClick={() => undefined}
                style={roleButtonStyle(role === 'DOCTOR')}
              >
                Médecin
              </button>
            </div>
          </div>
        ) : null}
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailHint(null);
            setEmailAvailable(null);
          }}
          onBlur={() => void checkEmailAvailability(email)}
          style={inputStyle}
        />
        {emailHint ? (
          <p style={{ margin: '-4px 2px 0', fontSize: 13, color: emailAvailable === false ? '#b91c1c' : '#065f46' }}>
            {emailHint}
          </p>
        ) : null}
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {password ? (
          <p
            style={{
              margin: '-4px 2px 0',
              fontSize: 13,
              color: validatePassword(password, email) ? '#b91c1c' : '#065f46',
            }}
          >
            {validatePassword(password, email) || 'Mot de passe acceptable.'}
          </p>
        ) : null}
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
        {confirmPassword ? (
          <p style={{ margin: '-4px 2px 0', fontSize: 13, color: password === confirmPassword ? '#065f46' : '#b91c1c' }}>
            {password === confirmPassword ? 'Les mots de passe correspondent.' : 'Les mots de passe ne correspondent pas.'}
          </p>
        ) : null}

        {awaitingVerification ? (
          <p style={{ margin: '-2px 2px 0', fontSize: 13, color: '#475569' }}>
            Vérifie ta boîte mail puis clique sur le lien de confirmation pour activer ton compte.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !email || !password || !confirmPassword}
          style={{ ...btnStyle, opacity: busy || !email || !password || !confirmPassword ? 0.7 : 1, cursor: busy || !email || !password || !confirmPassword ? 'default' : 'pointer' }}
        >
          {busy ? 'Création…' : 'Créer un compte'}
        </button>

        {msg && (
          <p
            style={{
              margin: 0,
              color: msg.includes('✅') || awaitingVerification ? '#065f46' : '#b91c1c',
            }}
          >
            {msg}
          </p>
        )}
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

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#334155',
};

const roleGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 8,
};

const roleButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '11px 12px',
  borderRadius: 10,
  border: active ? '1px solid #4f46e5' : '1px solid #ddd',
  background: active ? '#eef2ff' : '#fff',
  color: active ? '#312e81' : '#111',
  fontWeight: 700,
  cursor: 'pointer',
});

const btnStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #4f46e5',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};
