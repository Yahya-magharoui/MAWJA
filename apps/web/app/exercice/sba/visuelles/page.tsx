'use client';
import { useEffect, useRef, useState } from 'react';
import BackLink from '../../../../components/BackLink';

export default function SBAVisuelles() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2); // px par frame
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState(1); // 1 => droite, -1 => gauche
  const reqRef = useRef<number>();
  const ballRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState(0);

  const BALL_SIZE = 28;

  useEffect(() => {
    const computeBounds = () => {
      const width = containerRef.current?.clientWidth ?? window.innerWidth;
      setBounds(Math.max(0, width - BALL_SIZE));
    };

    computeBounds();
    const resize = () => computeBounds();
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(() => computeBounds());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const animate = () => {
      setPos(prev => {
        let next = prev + dir * speed;
        const max = Math.max(0, bounds);
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
  }, [running, speed, dir, bounds]);

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
    }
  }

  function adjust(delta: number) {
    setSpeed(s => Math.min(20, Math.max(1, s + delta)));
    try { (navigator as any)?.vibrate?.(10); } catch {}
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <BackLink href="/exercice/sba" style={back} />
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Stimulation Bilatérales Alternées</h1>
          <p style={{ margin:'4px 0 0', opacity:.7, fontSize:13 }}>
            Mets ton téléphone en mode paysage si tu peux.  
            Suis le point sans bouger la tête, seulement les yeux.
          </p>
        </div>
        <button style={gear}>⚙️</button>
      </header>

      <div ref={containerRef} style={track}>
        <div
          ref={ballRef}
          style={{
            ...ball,
            transform:`translateX(${pos}px)`
          }}
        />
      </div>

      <footer style={foot}>
        <div style={controlsRow}>
          <button onClick={toggle} style={btnMain}>
            {running ? 'Pause' : 'Début'}
          </button>
          <div style={speedWrap}>
            <span style={speedLabel}>Vitesse</span>
            <button onClick={() => adjust(-1)} style={mini}>−</button>
            <span style={speedValue}>{speed}</span>
            <button onClick={() => adjust(+1)} style={mini}>＋</button>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** styles */
const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 0 32px', display:'flex', flexDirection:'column' };
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center', marginBottom:10, padding:'0 20px' };
const back: React.CSSProperties = { justifySelf: 'start' };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'6px 8px', cursor:'pointer', justifySelf:'end' };
const track: React.CSSProperties = { flex:1, display:'flex', alignItems:'center', justifyContent:'flex-start', width:'100%', margin:'0', position:'relative', paddingBottom:56 };
const ball: React.CSSProperties = { width:28, height:28, borderRadius:'50%', background:'var(--theme-color)', boxShadow:'0 4px 12px rgba(0,0,0,.2)', transition:'transform 0.1s linear' };
const foot: React.CSSProperties = { display:'flex', justifyContent:'flex-start', alignItems:'center', marginTop:8, padding:'0 20px', position:'sticky', bottom:16 };
const controlsRow: React.CSSProperties = { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' };
const btnMain: React.CSSProperties = { border:'none', padding:'12px 20px', borderRadius:14, background:'var(--theme-color)', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,.2)' };
const speedWrap: React.CSSProperties = { display:'flex', alignItems:'center', gap:6, flexWrap:'nowrap' };
const speedLabel: React.CSSProperties = { fontWeight:600, fontSize:14, whiteSpace:'nowrap' };
const speedValue: React.CSSProperties = { minWidth:32, textAlign:'center', fontWeight:700 };
const mini: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', padding:'8px 12px', borderRadius:999, cursor:'pointer' };
