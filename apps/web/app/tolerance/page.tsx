'use client';
import { useRouter } from 'next/navigation';
import BackLink from '../../components/BackLink';

export default function ToleranceHome() {
  const router = useRouter();

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href={null} onClick={() => router.back()} style={backBtn} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Fenêtre de tolérance</h1>
        <div />
      </header>

      <p style={{ margin:'6px 20px 14px', opacity:.7, maxWidth:720 }}>
        Choisis ce que tu veux faire.
      </p>

      <section style={grid}>
        <a href="/exercice/emotions" className="tile" style={tile}>
         <img
            src="/icons/emotion.svg"
            alt="Roue des émotions"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Roue des émotions</span>
        </a>
        <a href="/tolerance/objectifs" className="tile" style={tile}>
         <img
            src="/icons/objectif.svg"
            alt="Mes objectifs"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Mes objectifs</span>
        </a>
        <a href="/tolerance/notes" className="tile" style={tile}>
         <img
            src="/icons/notes.svg"
            alt="Mes notes"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Mes notes</span>
        </a>
        <a href="/tolerance/routine" className="tile" style={tile}>
         <img
            src="/icons/routine.svg"
            alt="Ma routine"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Ma routine</span>
        </a>
        <a href="/tolerance/historique" className="tile" style={tile}>
         <img
            src="/icons/historique.svg"
            alt="Historique"
            style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            />
        <span>Historique</span>
        </a>
      </section>

      <style>{css}</style>
    </main>
  );
}

const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' };
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' };
const backBtn: React.CSSProperties = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' };

const grid: React.CSSProperties = {
  display:'grid', gap:16,
  gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))',
  padding:'0 20px', maxWidth:900, margin:'0 auto'
};
const tile: React.CSSProperties = {
  display:'grid', placeItems:'center', gap:8,
  textDecoration:'none', color:'#0f172a', fontWeight:700,
  borderRadius:18, padding:'26px 12px',
  background:'#E9E6FF',
  boxShadow:'0 8px 18px rgba(0,0,0,.06)'
};
const css = `.tile span{display:block;font-size:14px}`;
