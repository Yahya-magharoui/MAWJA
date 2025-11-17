'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    // 🔹 Simulation (pas de backend pour l'instant)
    setTimeout(() => {
      // on sauvegarde un "profil" local
      localStorage.setItem(
        'guestProfile',
        JSON.stringify({
          id: crypto.randomUUID(),
          email,
          role: 'user',
          loggedInAt: new Date().toISOString(),
        })
      );
      setBusy(false);
      setMsg('Connexion réussie ✅');
      router.push('/home');
    }, 700);
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#F6F7FE' }}>
      <form onSubmit={handleSubmit}
        style={{ width: 340, display: 'grid', gap: 12, padding: 24, borderRadius: 16, background: '#fff',
                 boxShadow: '0 8px 24px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Se connecter</h1>

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
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>

        {msg && <p style={{ margin: 0, color: '#065f46' }}>{msg}</p>}
        <a href="/" style={{ textAlign: 'center', fontSize: 13, marginTop: 4 }}>↩︎ Retour</a>
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
