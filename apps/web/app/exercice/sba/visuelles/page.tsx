'use client';
import { useEffect, useRef, useState } from 'react';

export default function SBAVisuelles() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2); // px par frame
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState(1); // 1 => droite, -1 => gauche
  const reqRef = useRef<number>();
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const animate = () => {
      setPos(prev => {
        let next = prev + dir * speed;
        const max = window.innerWidth - 80; // marge écran
        if (next <= 0) {
          next = 0;
          setDir(1);
        } else if (next >= max) {
          next = max;
          setDir(-1);
        }
        return next;
      });
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [running, speed, dir]);

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
    }
  }

  function adjust(delta: number) {
    setSpeed(s => Math.min(10, Math.max(1, s + delta)));
    try { (navigator as any)?.vibrate?.(10); } catch {}
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <a href="/exercice/sba" style={back} aria-label="Retour">←</a>
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Stimulation Bilatérales Alternées</h1>
          <p style={{ margin:'4px 0 0', opacity:.7, fontSize:13 }}>
            Mets ton téléphone en mode paysage si tu peux.  
            Suis le point sans bouger la tête, seulement les yeux.
          </p>
        </div>
        <button style={gear}>⚙️</button>
      </header>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'flex-start' }}>
        <div
          ref={ballRef}
          style={{
            ...ball,
            transform:`translateX(${pos}px)`
          }}
        />
      </div>

      <footer style={foot}>
        <button onClick={toggle} style={btnMain}>
          {running ? 'Pause' : 'Début'}
        </button>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => adjust(+1)} style={mini}>＋</button>
          <button onClick={() => adjust(-1)} style={mini}>−</button>
        </div>
      </footer>
    </main>
  );
}

/** styles */
const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 20px', display:'flex', flexDirection:'column' };
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center', marginBottom:10 };
const back: React.CSSProperties = { textDecoration:'none', color:'#111', fontSize:20 };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'6px 8px', cursor:'pointer', justifySelf:'end' };
const ball: React.CSSProperties = { width:28, height:28, borderRadius:'50%', background:'#A78BFA', boxShadow:'0 4px 12px rgba(0,0,0,.2)', transition:'transform 0.1s linear' };
const foot: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20 };
const btnMain: React.CSSProperties = { border:'none', padding:'12px 20px', borderRadius:14, background:'#A78BFA', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,.2)' };
const mini: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', padding:'8px 14px', borderRadius:999, cursor:'pointer' };
