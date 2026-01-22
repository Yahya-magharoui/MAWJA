'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackLink from '../../components/BackLink';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://mawja-back.onrender.com/api';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, "role":"PATIENT" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Création impossible. Essaie avec une autre adresse.');
      }

      if (data.access_token) {
        localStorage.setItem('authToken', data.access_token);
      }
      localStorage.setItem(
        'guestProfile',
        JSON.stringify(data.user ?? { email, createdAt: new Date().toISOString() })
      );
      localStorage.setItem('accountStatus', 'registered');

      setMsg('Compte créé ✅');
      setTimeout(() => {
        router.push('/login');
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
          width: 340,
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
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button type="submit" disabled={busy} style={btnStyle}>
          {busy ? 'Création…' : 'Créer un compte'}
        </button>

        {msg && <p style={{ margin: 0, color: '#065f46' }}>{msg}</p>}
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
