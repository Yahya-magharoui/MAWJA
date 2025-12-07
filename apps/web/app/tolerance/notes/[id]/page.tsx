'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackLink from '../../../../components/BackLink';

type Note = { id:string; text:string };

export default function NoteDetail(){
  const router = useRouter();
  const { id } = useParams<{id:string}>();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(()=>{
    const raw = localStorage.getItem('tolerance_notes');
    const list: Note[] = raw ? JSON.parse(raw) : [];
    setNote(list.find(n => n.id === id) ?? null);
  }, [id]);

  function del(){
    const raw = localStorage.getItem('tolerance_notes');
    const list: Note[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem('tolerance_notes', JSON.stringify(list.filter(n=>n.id!==id)));
    router.back();
  }

  if (!note) return null;

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin:0, fontSize:20 }}>Note</h1>
        <button onClick={del} title="Supprimer" style={trashBtn}>🗑️</button>
      </header>

      <div style={{ padding:'0 20px', maxWidth:700, margin:'0 auto' }}>
        <div style={bigCard}>{note.text}</div>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' } as const;
const hdr  = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' } as const;
const backBtn = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' } as const;
const trashBtn = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'6px 10px', cursor:'pointer' } as const;

const bigCard = { background:'#D9C8FF', borderRadius:24, padding:'26px', minHeight:300, boxShadow:'0 12px 26px rgba(0,0,0,.08)' } as const;
