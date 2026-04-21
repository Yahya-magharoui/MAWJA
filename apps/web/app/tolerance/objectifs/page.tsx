'use client';

import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../../components/BackLink';
import { useThemeColor, withAlpha } from '../../../components/theme';
import {
  createPatientGoal,
  deletePatientGoal,
  fetchPatientGoals,
  updatePatientGoal,
  type PatientGoal,
} from '../../../lib/patientTracking';

type Goal = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
};

const DONE_KEY = 'tolerance_goal_done_state';

function vibe(ms = 12) {
  try { (navigator as any)?.vibrate?.(ms); } catch {}
}

function readDoneMap() {
  if (typeof window === 'undefined') return {} as Record<string, boolean>;
  try {
    const raw = window.localStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeDoneMap(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DONE_KEY, JSON.stringify(map));
  } catch {}
}

function mergeGoals(apiGoals: PatientGoal[]) {
  const doneMap = readDoneMap();
  return apiGoals.map((goal) => ({
    id: goal.id,
    text: goal.text,
    createdAt: goal.createdAt,
    done: Boolean(doneMap[String(goal.id)]),
  }));
}

export default function ObjectifsPage() {
  const theme = useThemeColor();
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${withAlpha(theme, 0.13)} 0%, #F6F7FE 55%)`,
    [theme]
  );

  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGoals() {
      try {
        setLoading(true);
        setError(null);
        const apiGoals = await fetchPatientGoals();
        if (cancelled) return;
        setGoals(mergeGoals(apiGoals));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Impossible de charger les objectifs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadGoals();

    return () => {
      cancelled = true;
    };
  }, []);

  const doneCount = goals.filter((goal) => goal.done).length;

  async function addGoal() {
    const text = draft.trim();
    if (!text || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const createdGoal = await createPatientGoal({ text });
      setGoals((prev) => [{ id: createdGoal.id, text: createdGoal.text, createdAt: createdGoal.createdAt, done: false }, ...prev]);
      setDraft('');
      vibe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer l’objectif.');
    } finally {
      setSubmitting(false);
    }
  }

  function toggle(id: number) {
    setGoals((prev) => {
      const next = prev.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal));
      writeDoneMap(
        next.reduce<Record<string, boolean>>((acc, goal) => {
          if (goal.done) acc[String(goal.id)] = true;
          return acc;
        }, {})
      );
      return next;
    });
    vibe(18);
  }

  async function remove(id: number) {
    try {
      setError(null);
      await deletePatientGoal(id);
      setGoals((prev) => {
        const next = prev.filter((goal) => goal.id !== id);
        writeDoneMap(
          next.reduce<Record<string, boolean>>((acc, goal) => {
            if (goal.done) acc[String(goal.id)] = true;
            return acc;
          }, {})
        );
        return next;
      });
      vibe(10);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer l’objectif.');
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditingText(goal.text);
  }

  async function commitEdit() {
    if (editingId == null) return;

    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      setEditingText('');
      return;
    }

    try {
      setError(null);
      const updatedGoal = await updatePatientGoal(editingId, { text });
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === editingId ? { ...goal, text: updatedGoal.text, createdAt: updatedGoal.createdAt } : goal
        )
      );
      setEditingId(null);
      setEditingText('');
      vibe(8);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier l’objectif.');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  function move(id: number, dir: -1 | 1) {
    setGoals((prev) => {
      const index = prev.findIndex((goal) => goal.id === id);
      if (index < 0) return prev;
      const nextIndex = index + dir;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [goal] = next.splice(index, 1);
      next.splice(nextIndex, 0, goal);
      return next;
    });
  }

  function markAll(value: boolean) {
    setGoals((prev) => {
      const next = prev.map((goal) => ({ ...goal, done: value }));
      writeDoneMap(
        next.reduce<Record<string, boolean>>((acc, goal) => {
          if (goal.done) acc[String(goal.id)] = true;
          return acc;
        }, {})
      );
      return next;
    });
  }

  async function clearDone() {
    const doneGoals = goals.filter((goal) => goal.done);
    if (doneGoals.length === 0) return;

    try {
      setError(null);
      await Promise.all(doneGoals.map((goal) => deletePatientGoal(goal.id)));
      setGoals((prev) => {
        const next = prev.filter((goal) => !goal.done);
        writeDoneMap({});
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer les objectifs accomplis.');
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: bg, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color: '#0f172a' }}>
      <header style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '16px 20px' }}>
        <BackLink href="/tolerance" style={{ justifySelf: 'start' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Mes Objectifs</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>Note quelques objectifs sur lesquels tu souhaites travailler</p>
        </div>
        <div />
      </header>

      <div style={{ maxWidth: 720, margin: '6px auto 0', padding: '0 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
            border: '1px solid rgba(0,0,0,.06)',
            borderRadius: 14,
            padding: 10,
            background: '#fff',
            boxShadow: '0 8px 18px rgba(0,0,0,.06)',
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') void addGoal(); }}
            placeholder="Ajouter un objectif… (Entrée pour valider)"
            style={{ border: 'none', outline: 'none', fontSize: 15 }}
          />
          <button onClick={() => void addGoal()} disabled={submitting} style={btnPrimary(theme, submitting)}>
            {submitting ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, opacity: 0.75 }}>
            Progression&nbsp;: <strong>{doneCount}</strong> / {goals.length}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => markAll(true)} style={btnTiny}>Tout cocher</button>
          <button onClick={() => markAll(false)} style={btnTiny}>Tout décocher</button>
          <button onClick={() => void clearDone()} style={btnTiny}>Supprimer les accomplis</button>
        </div>

        {error && <div style={infoCard}>{error}</div>}
      </div>

      <section style={{ maxWidth: 720, margin: '10px auto 0', padding: '0 20px', display: 'grid', gap: 10 }}>
        {loading && <div style={emptyState}>Chargement des objectifs…</div>}
        {!loading && goals.length === 0 && <div style={emptyState}>Aucun objectif pour le moment.</div>}

        {!loading && goals.map((goal, index) => (
          <article key={goal.id} style={row}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={goal.done}
                onChange={() => toggle(goal.id)}
                style={{ width: 18, height: 18 }}
              />
              {editingId === goal.id ? (
                <input
                  autoFocus
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  onBlur={() => void commitEdit()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void commitEdit();
                    if (event.key === 'Escape') cancelEdit();
                  }}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', width: '100%' }}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(goal)}
                  style={{
                    textDecoration: goal.done ? 'line-through' : 'none',
                    opacity: goal.done ? 0.6 : 1,
                    userSelect: 'none',
                  }}
                >
                  {goal.text}
                </span>
              )}
            </label>

            <div style={{ display: 'flex', gap: 6 }}>
              <button title="Éditer" onClick={() => startEdit(goal)} style={btnIcon}>✏️</button>
              <button title="Monter" onClick={() => move(goal.id, -1)} disabled={index === 0} style={btnIcon} aria-disabled={index === 0}>⤴︎</button>
              <button title="Descendre" onClick={() => move(goal.id, +1)} disabled={index === goals.length - 1} style={btnIcon} aria-disabled={index === goals.length - 1}>⤵︎</button>
              <button title="Supprimer" onClick={() => void remove(goal.id)} style={btnIcon}>🗑️</button>
            </div>
          </article>
        ))}
      </section>

      <div style={{ height: 34 }} />
    </main>
  );
}

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  background: '#fff',
  border: '1px solid rgba(0,0,0,.06)',
  borderRadius: 14,
  boxShadow: '0 8px 18px rgba(0,0,0,.06)',
};

const btnPrimary = (color: string, disabled: boolean): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: color,
  color: '#fff',
  fontWeight: 800,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.7 : 1,
});

const btnTiny: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

const btnIcon: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};

const infoCard: React.CSSProperties = {
  marginTop: 12,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(239,68,68,.18)',
  background: '#fff',
  color: '#991b1b',
};

const emptyState: React.CSSProperties = {
  textAlign: 'center',
  opacity: 0.65,
  padding: '20px 0',
};
