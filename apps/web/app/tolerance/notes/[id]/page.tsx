'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { deletePatientNote, fetchPatientNotes, type PatientNote } from '../../../../lib/patientTracking';

type Note = {
  id: number;
  text: string;
};

function toNote(note: PatientNote): Note {
  return {
    id: note.id,
    text: note.text,
  };
}

export default function NoteDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const noteId = Number(id);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      try {
        setLoading(true);
        setError(null);
        const notes = await fetchPatientNotes();
        if (cancelled) return;

        const found = notes.find((entry) => entry.id === noteId) ?? null;
        setNote(found ? toNote(found) : null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Impossible de charger la note.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!Number.isFinite(noteId)) {
      setError('Identifiant de note invalide.');
      setLoading(false);
      return;
    }

    void loadNote();

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  async function removeNote() {
    if (!Number.isFinite(noteId)) return;

    try {
      setError(null);
      await deletePatientNote(noteId);
      router.push('/tolerance/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer la note.');
    }
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Note</h1>
        <button onClick={() => void removeNote()} title="Supprimer" style={trashBtn}>🗑️</button>
      </header>

      <div style={{ padding: '0 20px', maxWidth: 700, margin: '0 auto' }}>
        {loading ? <div style={statusCard}>Chargement…</div> : null}
        {error ? <div style={errorCard}>{error}</div> : null}
        {!loading && !error && !note ? <div style={statusCard}>Note introuvable.</div> : null}
        {!loading && !error && note ? <div style={bigCard}>{note.text}</div> : null}
      </div>
    </main>
  );
}

const wrap = { minHeight: '100dvh', background: '#F6F7FE', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color: '#0f172a' } as const;
const hdr = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '16px 20px' } as const;
const backBtn = { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#111' } as const;
const trashBtn = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' } as const;

const bigCard = { background: '#D9C8FF', borderRadius: 24, padding: '26px', minHeight: 300, boxShadow: '0 12px 26px rgba(0,0,0,.08)' } as const;
const statusCard = { background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 8px 18px rgba(0,0,0,.06)', color: '#334155' } as const;
const errorCard = { marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(239,68,68,.18)', background: '#fff', color: '#991b1b' } as const;
