'use client';

type Props = {
  subject: string;
};

export default function AuthRequiredNotice({ subject }: Props) {
  return (
    <section
      style={{
        maxWidth: 720,
        margin: '24px auto 0',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 20,
          padding: '22px 20px',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Connexion requise</h2>
        <p style={{ margin: '10px 0 0', color: '#475569', lineHeight: 1.5 }}>
          Connecte-toi pour accéder à {subject} et synchroniser tes données avec ton compte.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <a
            href="/login"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--theme-color)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Se connecter
          </a>
          <a
            href="/signup"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #dbe1f0',
              background: '#fff',
              color: '#0f172a',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Créer un compte
          </a>
        </div>
      </div>
    </section>
  );
}
