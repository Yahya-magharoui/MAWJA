'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../../components/BackLink';

type Card = { key:string; label:string; href:string };

const ALL: Card[] = [
  { key:'toolkit',  label:'Boîte à outils', href:'/toolkit' },
  { key:'safe',     label:'Sécurisation (lieu sûr)', href:'/exercice/safe-place' },
  { key:'mindful',  label:'Audios rythmés', href:'/exercice/mindful?mode=rythme' },
  { key:'anchor',   label:'Ancrage sensoriel', href:'/exercice/anchoring' },
];

export default function RoutinePage(){
  const router = useRouter();
  const [favKeys, setFavKeys] = useState<string[]>([]);

  useEffect(()=>{ const s = localStorage.getItem('routine_favs'); if(s) setFavKeys(JSON.parse(s)); },[]);
  useEffect(()=>{ localStorage.setItem('routine_favs', JSON.stringify(favKeys)); },[favKeys]);

  const favs = useMemo(()=>ALL.filter(c=>favKeys.includes(c.key)),[favKeys]);

  function remove(k:string){
    if (!confirm('Retirer cet exercice des favoris ?')) return;
    setFavKeys(keys => keys.filter(x => x !== k));
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin:0, fontSize:20 }}>Ma routine</h1>
        <div />
      </header>

      <p style={{ margin:'0 20px 10px', opacity:.7 }}>Pratique les exercices que tu as ajoutés en favoris</p>

      <div style={{ padding:'0 20px', maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14 }}>
        {favs.length === 0 && <div style={{ opacity:.6 }}>Aucun favori pour le moment.</div>}
        {favs.map(c=>(
          <a key={c.key} href={c.href} style={tile}>
            <span style={{ position:'absolute', right:10, top:10, fontSize:18, cursor:'pointer' }} onClick={(e)=>{ e.preventDefault(); remove(c.key); }}>★</span>
            <div style={{ fontSize:36, marginBottom:8 }}>✨</div>
            <div style={{ fontWeight:700 }}>{c.label}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

const wrap = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' } as const;
const hdr  = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' } as const;
const backBtn = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' } as const;

const tile: React.CSSProperties = {
  position:'relative',
  display:'grid', placeItems:'center', gap:6,
  textDecoration:'none', color:'#0f172a',
  borderRadius:18, padding:'26px 12px',
  background:'#E9E6FF',
  boxShadow:'0 8px 18px rgba(0,0,0,.06)'
};
