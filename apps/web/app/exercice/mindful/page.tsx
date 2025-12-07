'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackLink from '../../../components/BackLink';

type Track = {
  id: string;
  label: string;
  icon?: string;          // chemin vers public/icons/*.svg
  src?: string;           // optionnel : URL absolue ; sinon /audio/mindful/<id>.mp3
};

const TRACKS: Track[] = [
  { id: 'ocean',      label: 'Océan',            icon: '/icons/ocean.svg' },
  { id: 'rain',       label: 'Pluie douce',      icon: '/icons/pluie.svg' },
  { id: 'birds',      label: 'Oiseaux',          icon: '/icons/oiseau.svg' },
  { id: 'breeze',     label: 'Brise',            icon: '/icons/brise.svg' },
  { id: 'forest',     label: 'Forêt',            icon: '/icons/foret.svg' },
  { id: 'zen',        label: 'Feu de cheminee',  icon: '/icons/zen.svg' },
  { id: 'night',      label: 'Ecriture',         icon: '/icons/ecriture.svg' },
  { id: 'city-soft',  label: 'Clavier',          icon: '/icons/clavier.svg' },
  { id: 'meditate',   label: 'Relaxation',       icon: '/icons/relaxation.svg' },
];

// util: chemin par défaut dans /public/audio/mindful/<id>.mp3
const srcFor = (t: Track) => t.src ?? `/audio/mindful/${t.id}.mp3`;

/* ---------- Helper pour afficher l'icône ---------- */
// - si `icon` est fourni (chemin string), on rend un <img>
// - sinon fallback emoji décoratif (ou rien)
// - alt: comme le label est affiché à côté, on met alt="" pour marquer l'image décorative.
//   Si tu veux que l'image soit annoncée, mets alt={label} au lieu de "".
function RenderIcon({ icon, size = 40 }: { icon?: string; size?: number }) {
  if (!icon) return <span aria-hidden="true" style={{ fontSize: size }}>🎧</span>;
  return (
    <img
      src={icon}
      alt=""                // décoratif (le label textuel est déjà présent)
      aria-hidden="true"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
      loading="lazy"
    />
  );
}

/* ---------- Composant principal ---------- */
export default function MindfulAudiosPage() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioMap = useRef<Map<string, HTMLAudioElement>>(new Map());

  // libère les audios quand on quitte la page
  useEffect(() => {
    return () => {
      audioMap.current.forEach(a => { a.pause(); a.src = ''; a.load(); });
      audioMap.current.clear();
    };
  }, []);

  function vibe(ms = 15) {
    try { (navigator as any)?.vibrate?.(ms); } catch {}
  }

  // récupère / crée l’élément <audio> d’une piste
  function ensureAudio(id: string): HTMLAudioElement {
    let a = audioMap.current.get(id);
    if (!a) {
      const track = TRACKS.find(t => t.id === id)!;
      a = new Audio(srcFor(track));
      a.preload = 'auto';
      a.addEventListener('ended', () => {
        if (currentId === id) setIsPlaying(false);
      });
      audioMap.current.set(id, a);
    }
    return a;
  }

  async function playToggle(id: string) {
    vibe();
    if (currentId === id) {
      const a = ensureAudio(id);
      if (isPlaying) { a.pause(); setIsPlaying(false); }
      else { await a.play().catch(()=>{}); setIsPlaying(true); }
      return;
    }
    if (currentId) {
      const prev = audioMap.current.get(currentId);
      prev?.pause();
      prev && (prev.currentTime = 0);
    }
    const a = ensureAudio(id);
    try { await a.play(); setIsPlaying(true); } catch { setIsPlaying(false); }
    setCurrentId(id);
  }

  function stopAll() {
    if (!currentId) return;
    audioMap.current.get(currentId)?.pause();
    setIsPlaying(false);
    setCurrentId(null);
  }

  function randomPlay() {
    const pick = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    playToggle(pick.id);
  }

  const headerHint = useMemo(
    () => (isPlaying ? 'Appuie pour mettre en pause • 🔊' : 'Appuie pour jouer • ▶️'),
    [isPlaying]
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <BackLink href="/hyperactivation" style={styles.back} />
        <h1 style={styles.h1}>Audios de pleine conscience</h1>
        <button aria-label="Paramètres" title="Paramètres" style={styles.gear}>⚙️</button>
      </header>

      <p style={styles.subtitle}>
        Sélectionne une piste à écouter — {headerHint}
      </p>

      <section style={styles.grid}>
        {TRACKS.map(t => {
          const active = currentId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="bubble"
              onClick={() => playToggle(t.id)}
              onMouseDown={() => vibe()}
              aria-pressed={active && isPlaying}
              style={{
                ...styles.bubble,
                ...(active ? styles.bubbleActive : null),
              }}
            >
              <div style={styles.iconWrap}>
                <RenderIcon icon={t.icon} size={42} />
              </div>

              {/* overlay play/pause */}
              <span style={{
                ...styles.overlay,
                opacity: active ? 1 : 0,
              }}>
                {isPlaying && active ? '⏸' : '▶️'}
              </span>

              <span style={styles.caption}>{t.label}</span>
            </button>
          );
        })}
      </section>

      <div style={{ display:'flex', gap:10, justifyContent:'center', margin:'18px 0 10px' }}>
        <button onClick={randomPlay} style={styles.btnPrimary} onMouseDown={()=>vibe()}>Choix aléatoire 🎲</button>
        <button onClick={stopAll} style={styles.btnGhost}>Stop</button>
      </div>

      <style>{css}</style>
    </main>
  );
}

/* styles */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#F6F7FE',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    color: '#0f172a',
    padding: '16px 20px 28px',
  },
  header: { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' },
  back: { justifySelf: 'start' },
  h1: { margin:0, fontSize:20, fontWeight:800, textAlign:'center' },
  gear: {
    justifySelf:'end', border:'1px solid #e5e7eb', background:'#fff',
    borderRadius:12, padding:'8px 10px', cursor:'pointer'
  },
  subtitle: { margin:'8px 0 16px', opacity:.7, fontSize:14, textAlign:'center' },

  grid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',
    gap:18,
    maxWidth:680,
    margin:'0 auto',
  },

  bubble: {
    position:'relative',
    display:'grid',
    placeItems:'center',
    gap:8,
    border:'1px solid rgba(0,0,0,.06)',
    borderRadius:20,
    padding:'18px 10px 12px',
    background:'linear-gradient(180deg, rgba(var(--theme-color-rgb),0.133) 0%, rgba(var(--theme-color-rgb),0.07) 100%)',
    boxShadow:'0 10px 22px rgba(0,0,0,.08)',
    cursor:'pointer',
    transition:'transform .12s ease, box-shadow .12s ease, filter .12s ease',
  },
  bubbleActive: {
    outline:'2px solid var(--theme-color)',
    boxShadow:'0 14px 28px rgba(var(--theme-color-rgb),.35)',
  },

  iconWrap: {
    width: 56,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    background: 'transparent',
    marginBottom: 4,
  },

  caption: { fontWeight:700, fontSize:14, textAlign:'center' },
  overlay: {
    position:'absolute',
    top:8, right:10,
    fontSize:16,
    background:'#fff',
    border:'1px solid rgba(0,0,0,.06)',
    borderRadius:12,
    padding:'2px 8px',
    boxShadow:'0 4px 10px rgba(0,0,0,.08)',
    transition:'opacity .12s ease',
    pointerEvents:'none',
  },

  btnPrimary: {
    background:'var(--theme-color)', color:'#fff', border:'none',
    padding:'10px 14px', borderRadius:12, fontWeight:700,
    boxShadow:'0 8px 18px rgba(0,0,0,.12)', cursor:'pointer'
  },
  btnGhost: {
    background:'transparent', border:'1px solid #e5e7eb',
    padding:'10px 14px', borderRadius:12, fontWeight:600, cursor:'pointer'
  },
};

const css = `
  .bubble:active { transform: scale(0.985); filter: brightness(0.98); }
  @media (hover:hover) {
    .bubble:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,.12); }
  }
`;
