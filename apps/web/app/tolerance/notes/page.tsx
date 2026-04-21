'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useThemeColor } from '../../../components/theme';
import BackLink from '../../../components/BackLink';
import {
  createPatientNote,
  deletePatientNote,
  fetchPatientNotes,
  updatePatientNote,
  type PatientNote,
} from '../../../lib/patientTracking';

type Note = {
  id: number;
  text: string;
  createdAt: string;
};

function toNote(note: PatientNote): Note {
  return {
    id: note.id,
    text: note.text,
    createdAt: note.createdAt,
  };
}

export default function NotesPage() {
  const router = useRouter();
  const themeColor = useThemeColor();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPatientNotes();
        if (cancelled) return;
        setNotes(response.map(toNote));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Impossible de charger les notes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveNote() {
    const text = draft.trim();
    if (!text || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (editingId != null) {
        const updated = await updatePatientNote(editingId, { text });
        setNotes((current) => current.map((note) => (note.id === editingId ? toNote(updated) : note)));
        setEditingId(null);
        setDraft('');
        return;
      }

      const created = await createPatientNote({ text });
      setNotes((current) => [toNote(created), ...current]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer la note.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setDraft(note.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft('');
  }

  async function removeNote(noteId: number) {
    try {
      setError(null);
      await deletePatientNote(noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      if (editingId === noteId) {
        setEditingId(null);
        setDraft('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer la note.');
    }
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Mes Notes</h1>
        <div />
      </header>

      <p style={{ margin: '0 20px 10px', opacity: 0.7 }}>Écris ce dont tu souhaites te souvenir ou que tu as remarqué</p>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void saveNote();
            }}
            placeholder="Ajouter une note…"
            style={input}
          />
          <button onClick={() => void saveNote()} disabled={saving} style={buttonStyle(themeColor, saving)}>
            {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingId ? (
            <button onClick={cancelEdit} style={btnGhost}>Annuler</button>
          ) : null}
          <a href="/tolerance/notes/guides" style={smallLink}>Questions guidées →</a>
        </div>

        {error && <div style={errorCard}>{error}</div>}

        {loading ? <div style={emptyState}>Chargement des notes…</div> : null}
        {!loading && notes.length === 0 ? <div style={emptyState}>Aucune note pour le moment.</div> : null}

        <div style={cards}>
          {!loading && notes.map((note) => (
            <article key={note.id} style={card}>
              <a
                href={`/tolerance/notes/${note.id}`}
                style={{ textDecoration: 'none', color: '#0f172a', flex: 1 }}
              >
                {note.text}
              </a>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    startEdit(note);
                  }}
                  style={smallButton(themeColor)}
                >
                  Modifier
                </button>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    void removeNote(note.id);
                  }}
                  style={dangerButton}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

const wrap = { minHeight: '100dvh', background: '#F6F7FE', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color: '#0f172a' } as const;
const hdr = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '16px 20px' } as const;
const backBtn = { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#111' } as const;

const input = { flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none' } as const;
const buttonStyle = (color: string, disabled: boolean) => ({
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: color,
  color: '#fff',
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.7 : 1,
});
const smallLink = { alignSelf: 'center', fontSize: 13, textDecoration: 'none', padding: '6px 8px', borderRadius: 8, background: '#efeafe', color: '#4b3ca7' } as const;

const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 } as const;
const card = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '16px', borderRadius: 16, background: '#D9C8FF', color: '#0f172a', textDecoration: 'none', boxShadow: '0 8px 18px rgba(0,0,0,.06)' } as const;
const btnGhost = { padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' } as const;
const smallButton = (color: string) => ({ padding: '8px 10px', borderRadius: 10, border: 'none', background: color, color: '#fff', fontWeight: 600, cursor: 'pointer' } as const);
const dangerButton = { padding: '8px 10px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' } as const;
const emptyState = { textAlign: 'center', opacity: 0.65, padding: '20px 0' } as const;
const errorCard = { marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(239,68,68,.18)', background: '#fff', color: '#991b1b' } as const;
