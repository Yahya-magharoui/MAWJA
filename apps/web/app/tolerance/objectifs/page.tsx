'use client';

import { useEffect, useMemo, useState } from 'react';

type Goal = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

const LS_KEY = 'tolerance_goals';

function vibe(ms = 12) {
  try { (navigator as any)?.vibrate?.(ms); } catch {}
}

export default function ObjectifsPage() {
  const theme = '#A78BFA';

  // fond doux comme le reste de l’app
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${theme}22 0%, #F6F7FE 55%)`,
    []
  );

  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // charge / sauvegarde locale
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setGoals(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(goals)); } catch {}
  }, [goals]);

  const doneCount = goals.filter(g => g.done).length;

  function addGoal() {
    const text = draft.trim();
    if (!text) return;
    const g: Goal = { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() };
    setGoals(prev => [g, ...prev]);
    setDraft('');
    vibe();
  }

  function toggle(id: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
    vibe(18);
  }

  function remove(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id));
    vibe(10);
  }

  function startEdit(g: Goal) {
    setEditingId(g.id);
    setEditingText(g.text);
  }
  function commitEdit() {
    if (!editingId) return;
    const t = editingText.trim();
    if (!t) { setEditingId(null); return; }
    setGoals(prev => prev.map(g => g.id === editingId ? ({ ...g, text: t }) : g));
    setEditingId(null);
    setEditingText('');
    vibe(8);
  }

  function move(id: string, dir: -1 | 1) {
    setGoals(prev => {
      const i = prev.findIndex(g => g.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const clone = [...prev];
      const [item] = clone.splice(i, 1);
      clone.splice(j, 0, item);
      return clone;
    });
  }

  function markAll(v: boolean) {
    setGoals(prev => prev.map(g => ({ ...g, done: v })));
  }
  function clearDone() {
    setGoals(prev => prev.filter(g => !g.done));
  }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' }}>
      {/* header */}
      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <a href="/tolerance" aria-label="Retour" style={{ textDecoration:'none', color:'#111', fontSize:20 }}>←</a>
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Mes Objectifs</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, opacity:.7 }}>Note quelques objectifs sur lesquels tu souhaites travailler</p>
        </div>
        <div />
      </header>

      {/* add bar */}
      <div style={{ maxWidth:720, margin:'6px auto 0', padding:'0 20px' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr auto', gap:10,
          border:'1px solid rgba(0,0,0,.06)', borderRadius:14, padding:10, background:'#fff',
          boxShadow:'0 8px 18px rgba(0,0,0,.06)'
        }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGoal(); }}
            placeholder="Ajouter un objectif… (Entrée pour valider)"
            style={{ border:'none', outline:'none', fontSize:15 }}
          />
          <button onClick={addGoal} style={btnPrimary(theme)}>Ajouter</button>
        </div>

        {/* toolbar */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10, alignItems:'center' }}>
          <span style={{ fontSize:13, opacity:.75 }}>
            Progression&nbsp;: <strong>{doneCount}</strong> / {goals.length}
          </span>
          <div style={{ flex:1 }} />
          <button onClick={()=>markAll(true)}  style={btnTiny}>Tout cocher</button>
          <button onClick={()=>markAll(false)} style={btnTiny}>Tout décocher</button>
          <button onClick={clearDone} style={btnTiny}>Supprimer les accomplis</button>
        </div>
      </div>

      {/* list */}
      <section style={{ maxWidth:720, margin:'10px auto 0', padding:'0 20px', display:'grid', gap:10 }}>
        {goals.length === 0 && (
          <div style={{ textAlign:'center', opacity:.65, padding:'20px 0' }}>
            Ajoute ton premier objectif pour commencer ✨
          </div>
        )}

        {goals.map((g, idx) => (
          <article key={g.id} style={row}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={g.done}
                onChange={() => toggle(g.id)}
                style={{ width:18, height:18 }}
              />
              {/* texte / édition */}
              {editingId === g.id ? (
                <input
                  autoFocus
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 8px', width:'100%' }}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(g)}
                  style={{
                    textDecoration: g.done ? 'line-through' as const : 'none',
                    opacity: g.done ? .6 : 1,
                    userSelect:'none'
                  }}
                >
                  {g.text}
                </span>
              )}
            </label>

            {/* actions droites */}
            <div style={{ display:'flex', gap:6 }}>
              <button title="Éditer" onClick={() => startEdit(g)} style={btnIcon}>✏️</button>
              <button title="Monter" onClick={() => move(g.id, -1)} disabled={idx===0} style={btnIcon} aria-disabled={idx===0}>⤴︎</button>
              <button title="Descendre" onClick={() => move(g.id, +1)} disabled={idx===goals.length-1} style={btnIcon} aria-disabled={idx===goals.length-1}>⤵︎</button>
              <button title="Supprimer" onClick={() => remove(g.id)} style={btnIcon}>🗑️</button>
            </div>
          </article>
        ))}
      </section>

      <div style={{ height:34 }} />
    </main>
  );
}

/* — styles */
const row: React.CSSProperties = {
  display:'grid',
  gridTemplateColumns:'1fr auto',
  alignItems:'center',
  gap:10,
  padding:'12px 14px',
  background:'#fff',
  border:'1px solid rgba(0,0,0,.06)',
  borderRadius:14,
  boxShadow:'0 8px 18px rgba(0,0,0,.06)'
};

const btnPrimary = (c: string): React.CSSProperties => ({
  padding:'10px 14px',
  borderRadius:12,
  border:'none',
  background:c,
  color:'#fff',
  fontWeight:800,
  cursor:'pointer'
});

const btnTiny: React.CSSProperties = {
  padding:'8px 10px',
  borderRadius:10,
  border:'1px solid #e5e7eb',
  background:'#fff',
  cursor:'pointer',
  fontSize:13
};

const btnIcon: React.CSSProperties = {
  padding:'6px 8px',
  borderRadius:10,
  border:'1px solid #e5e7eb',
  background:'#fff',
  cursor:'pointer',
  fontSize:14
};
