'use client';
import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink';

type Emergency = {
  id: string;
  title: string;
  description: string;
  phone: string;      // sans espaces, ex: 15
  color: string;      // fond de la carte
  text?: string;      // couleur du texte optionnelle
  builtin?: boolean;  // true = carte système (non supprimable)
};

/* --- Cartes FR par défaut --- */
const BUILTIN: Emergency[] = [
  {
    id: 'samu',
    title: '15 – SAMU',
    description:
      "Pour l’intervention d’une équipe médicale en cas de détresse vitale, ou pour être redirigé vers un organisme de soins.",
    phone: '15',
    color: '#1268A6',
    text: '#fff',
    builtin: true,
  },
  {
    id: 'police',
    title: '17 – POLICE SECOURS',
    description:
      "Pour signaler une infraction nécessitant l’intervention immédiate de la police.",
    phone: '17',
    color: '#0D5062',
    text: '#fff',
    builtin: true,
  },
  {
    id: 'pompiers',
    title: '18 – SAPEURS-POMPIERS',
    description:
      "Pour signaler un péril ou un accident et obtenir leur intervention rapide.",
    phone: '18',
    color: '#D84037',
    text: '#fff',
    builtin: true,
  },
  {
    id: 'eu',
    title: '112 – N° D’URGENCE EUROPÉEN',
    description:
      "Victime ou témoin d’un accident dans un pays de l’Union Européenne.",
    phone: '112',
    color: '#1C6FB6',
    text: '#fff',
    builtin: true,
  },
  {
    id: 'suicide',
    title: '3114 – N° NATIONAL DE PRÉVENTION DU SUICIDE',
    description:
      "Écoute confidentielle 24/7 assurée par des professionnels formés.",
    phone: '3114',
    color: '#F0C419',
    text: '#111',
    builtin: true,
  },
  {
    id: '3919',
    title: '3919 – VIOLENCES FEMMES INFO',
    description:
      "Écoute et orientation des femmes victimes de violences (notamment conjugales).",
    phone: '3919',
    color: '#D6453D',
    text: '#fff',
    builtin: true,
  },
  {
    id: '115',
    title: '115 – NUMÉRO DU SAMU SOCIAL',
    description:
      "Urgence d’accueil et d’aide aux personnes sans abri et en grande difficulté.",
    phone: '115',
    color: '#F07F3C',
    text: '#fff',
    builtin: true,
  },
  {
    id: '114',
    title: '114 – N° POUR PERSONNES SOURDES ET MALENTENDANTES',
    description:
      "Contact par visio, tchat, SMS et fax pour joindre le 15/17/18. Application « Urgence 114 » (iOS/Android).",
    phone: '114',
    color: '#255B8E',
    text: '#fff',
    builtin: true,
  },
  {
    id: '119',
    title: '119 – ALLO ENFANCE EN DANGER',
    description:
      "Numéro dédié aux enfants en danger, victimes de violences physiques ou psychologiques.",
    phone: '119',
    color: '#111',
    text: '#fff',
    builtin: true,
  },
];

/* --- Helpers --- */
const LS_KEY = 'customEmergencyContacts';

export default function EmergencyPage() {
  const [customs, setCustoms] = useState<Emergency[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<{ title: string; phone: string; notes: string }>({
    title: '',
    phone: '',
    notes: '',
  });

  /* Charge / persiste les contacts perso */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCustoms(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(customs));
    } catch {}
  }, [customs]);

  const allCards = useMemo(() => [...BUILTIN, ...customs], [customs]);

  function addCustom() {
    const title = draft.title.trim();
    const phone = draft.phone.replace(/\s+/g, '');
    if (!title || !phone) return;

    setCustoms((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        title,
        description: draft.notes.trim() || 'Contact personnel',
        phone,
        color: '#6B7280', // gris doux
        text: '#fff',
      },
    ]);
    setDraft({ title: '', phone: '', notes: '' });
    setShowForm(false);
    vibrate(18);
  }

  function removeCustom(id: string) {
    setCustoms((prev) => prev.filter((c) => c.id !== id));
    vibrate(12);
  }

  function vibrate(n: number) {
    if ('vibrate' in navigator) {
      try {
        (navigator as any).vibrate?.(n);
      } catch {}
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <BackLink href="/hyperactivation" style={styles.back} />
        <h1 style={styles.h1}>Numéros d’urgence</h1>
        <button style={styles.gear} title="Paramètres">⚙️</button>
      </header>

      <p style={styles.subtitle}>
        Les numéros d’urgence gratuits et joignables 7j/7 et 24h/24
      </p>

      <section style={styles.list}>
        {allCards.map((c) => (
          <article key={c.id} style={card(c.color, c.text)}>
            <div style={styles.cardHeader}>
              <span aria-hidden>📞</span>
              <a
                href={`tel:${c.phone}`}
                style={styles.cardTitle}
                onMouseDown={() => vibrate(15)}
              >
                {c.title}
              </a>
            </div>
            <p style={styles.cardDesc}>{c.description}</p>
            <div style={styles.cardActions}>
              <a href={`tel:${c.phone}`} style={styles.callBtn}>Appeler</a>
              {!c.builtin && (
                <button
                  onClick={() => removeCustom(c.id)}
                  style={styles.deleteBtn}
                  aria-label={`Supprimer ${c.title}`}
                >
                  Supprimer
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Formulaire ajout */}
      <div style={{ maxWidth: 820, margin: '16px auto 28px', padding: '0 16px' }}>
        {!showForm ? (
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>
            Ajouter une carte
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addCustom();
            }}
            style={styles.form}
          >
            <div style={styles.row}>
              <label style={styles.label}>Nom du contact</label>
              <input
                type="text"
                placeholder="Psychiatre, Médecin traitant…"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Notes (optionnel)</label>
              <textarea
                placeholder="Horaires, consignes…"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                style={{ ...styles.input, height: 80, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={styles.primary}>Enregistrer</button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ title: '', phone: '', notes: '' });
                  setShowForm(false);
                }}
                style={styles.ghost}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

/* ---------- styles ---------- */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#F6F7FE',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '16px 16px 4px',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
  },
  back: { justifySelf: 'start' },
  gear: {
    justifySelf: 'end',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 12,
    padding: '6px 8px',
    cursor: 'pointer',
  },
  h1: { margin: 0, fontSize: 24, textAlign: 'center', letterSpacing: 0.2 },
  subtitle: {
    maxWidth: 820,
    margin: '0 auto 10px',
    padding: '0 16px',
    opacity: 0.7,
  },
  list: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '8px 16px 0',
    display: 'grid',
    gap: 14,
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    fontWeight: 700,
  },
  cardTitle: { color: 'inherit', textDecoration: 'none', fontSize: 18 },
  cardDesc: { margin: '6px 0 10px', opacity: 0.9, lineHeight: 1.35 },

  cardActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  callBtn: {
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,.2)',
    border: '1px solid rgba(255,255,255,.45)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
  },
  deleteBtn: {
    padding: '8px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,.45)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },

  addBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,.04)',
  },

  form: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 6px 18px rgba(0,0,0,.06)',
  },
  row: { display: 'grid', gap: 6, marginBottom: 12 },
  label: { fontSize: 13, opacity: 0.75 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    outline: 'none',
    background: '#fafafa',
  },

  primary: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid transparent',
    background: '#6366F1',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  ghost: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

function card(bg: string, fg = '#fff'): React.CSSProperties {
  return {
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(0,0,0,.06)',
    background: bg,
    color: fg,
    boxShadow: '0 8px 18px rgba(0,0,0,.08)',
  };
}
