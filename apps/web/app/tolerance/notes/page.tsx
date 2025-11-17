'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Note = { id:string; text:string };

export default function NotesPage(){
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(()=>{
    const raw = localStorage.getItem('tolerance_notes');
    if (raw) setNotes(JSON.parse(raw));
    else {
      setNotes([
        { id:'n1', text:'Déclencheur repéré pendant les réunions familiales' },
        { id:'n2', text:'Respiration m’aide bien après le travail' },
      ]);
    }
  }, []);

  useEffect(()=>localStorage.setItem('tolerance_notes', JSON.stringify(notes)),[notes]);

  function add(){
    if (!draft.trim()) return;
    setNotes(n => [{ id: crypto.randomUUID(), text: draft.trim() }, ...n]);
    setDraft('');
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <button onClick={() => router.back()} aria-label="Retour" style={backBtn}>←</button>
        <h1 style={{ margin:0, fontSize:20 }}>Mes Notes</h1>
        <div />
      </header>

      <p style={{ margin:'0 20px 10px', opacity:.7 }}>Écris ce dont tu souhaites te souvenir ou que tu as remarqué</p>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            placeholder="Ajouter une note…"
            style={input}
          />
          <button onClick={add} style={btn}>Ajouter</button>
          <a href="/tolerance/notes/guides" style={smallLink}>Questions guidées →</a>
        </div>

        <div style={cards}>
          {notes.map(n=>(
            <a key={n.id} href={`/tolerance/notes/${n.id}`} style={card}>
              {n.text}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' } as const;
const hdr  = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' } as const;
const backBtn = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' } as const;

const input = { flex:1, padding:'10px 12px', borderRadius:12, border:'1px solid #e5e7eb', outline:'none' } as const;
const btn = { padding:'10px 14px', borderRadius:12, border:'none', background:'#A78BFA', color:'#fff', fontWeight:700, cursor:'pointer' } as const;
const smallLink = { alignSelf:'center', fontSize:13, textDecoration:'none', padding:'6px 8px', borderRadius:8, background:'#efeafe', color:'#4b3ca7' } as const;

const cards = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12 } as const;
const card  = { display:'block', padding:'16px', borderRadius:16, background:'#D9C8FF', color:'#0f172a', textDecoration:'none', boxShadow:'0 8px 18px rgba(0,0,0,.06)' } as const;
