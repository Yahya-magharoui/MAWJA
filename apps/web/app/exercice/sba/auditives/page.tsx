'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** Un petit moteur SBA audio gauche↔︎droite via Web Audio */
class SBABinaural {
  ctx: AudioContext | null = null;
  master?: GainNode;
  pan?: StereoPannerNode;
  src?: AudioBufferSourceNode | OscillatorNode;
  gate?: GainNode;
  timer?: number;
  stepTimer?: number;
  playing = false;
  side = 1; // 1 => droite, -1 => gauche

  async ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.pan = this.ctx.createStereoPanner();
      this.pan.connect(this.master);
    }
  }

  /** crée une source selon l’instrument choisi */
  private buildSource(kind: Instrument) {
    if (!this.ctx || !this.pan) return;

    // gate = enveloppe pour bips doux
    this.gate = this.ctx.createGain();
    this.gate.gain.value = 0;
    this.gate.connect(this.pan);

    switch (kind) {
      case 'flute': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.connect(this.gate);
        this.src = osc;
        break;
      }
      case 'bip': {
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 800;
        osc.connect(this.gate);
        this.src = osc;
        break;
      }
      case 'cloche': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        osc.connect(this.gate);
        this.src = osc;
        break;
      }
      case 'piano': {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 330;
        osc.connect(this.gate);
        this.src = osc;
        break;
      }
      case 'tambour': {
        // bruit court (pseudo-drum)
        const buf = this.noiseBuffer();
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true; // on “bip” via gate, pas via loop
        src.connect(this.gate);
        this.src = src;
        break;
      }
      case 'tintement': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        osc.connect(this.gate);
        this.src = osc;
        break;
      }
    }
  }

  private noiseBuffer() {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); // petit decay
    return buffer;
  }

  async start(kind: Instrument, bpm: number, minutes = 5) {
    await this.ensureCtx();
    if (!this.ctx || !this.pan) return;
    this.stop();

    this.buildSource(kind);

    // démarre la source
    if (this.src instanceof OscillatorNode) this.src.start();
    if (this.src instanceof AudioBufferSourceNode) this.src.start();

    this.playing = true;
    const msPerBeat = Math.max(250, Math.round(60000 / bpm)); // borne mini 0.25s
    const beat = () => {
      if (!this.ctx || !this.pan || !this.gate) return;
      this.side *= -1;
      this.pan.pan.value = this.side; // -1 gauche / 1 droite

      // petite enveloppe “bip”
      const now = this.ctx.currentTime;
      this.gate.gain.cancelScheduledValues(now);
      this.gate.gain.setValueAtTime(0.0, now);
      this.gate.gain.linearRampToValueAtTime(0.8, now + 0.03);
      this.gate.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    };

    // lance le cycle
    beat();
    this.stepTimer = window.setInterval(beat, msPerBeat);

    // auto-stop après X minutes
    this.timer = window.setTimeout(() => this.stop(), minutes * 60 * 1000);
  }

  stop() {
    if (this.stepTimer) clearInterval(this.stepTimer);
    if (this.timer) clearTimeout(this.timer);
    this.stepTimer = this.timer = undefined;

    try {
      if (this.src && 'stop' in this.src) (this.src as any).stop();
    } catch {}
    try {
      this.src?.disconnect();
      this.gate?.disconnect();
    } catch {}

    this.src = undefined;
    this.gate = undefined;
    this.playing = false;
  }

  setBpm(newBpm: number) {
    // relancer le cycle (plus simple)
    if (!this.playing) return;
    // will be re-started by caller
  }
}

type Instrument = 'flute' | 'bip' | 'cloche' | 'piano' | 'tambour' | 'tintement';

const INSTRS: { key: Instrument; label: string; icon: string }[] = [
  { key: 'flute',    label: 'Flûte',    icon: '/icons/flute.svg' },
  { key: 'bip',      label: 'Bip',      icon: '/icons/bip.svg' },
  { key: 'cloche',   label: 'Cloche',   icon: '/icons/cloche.svg' },
  { key: 'piano',    label: 'Piano',    icon: '/icons/piano.svg' },
  { key: 'tambour',  label: 'Tambour',  icon: '/icons/tambour.svg' },
  { key: 'tintement',label: 'Tintement',icon: '/icons/tintement.svg' },
];

/* ---------- helper pour afficher l'icône (string path -> <img> ; sinon emoji) ---------- */
function RenderIcon({ icon, size = 36 }: { icon?: string; size?: number }) {
  if (!icon) return <span aria-hidden="true" style={{ fontSize: size }}>🎧</span>;

  if (typeof icon === 'string' && icon.startsWith('/')) {
    return (
      <img
        src={icon}
        alt="" /* décoratif (le label est affiché) */
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        style={{ display: 'block', objectFit: 'contain' }}
      />
    );
  }

  return <span aria-hidden="true" style={{ fontSize: size }}>{icon}</span>;
}

export default function SBAAuditivesPage() {
  const engineRef = useRef<SBABinaural | null>(null);
  const [bpm, setBpm] = useState(60); // vitesse par défaut
  const [current, setCurrent] = useState<Instrument | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  // nettoyage
  useEffect(() => () => engineRef.current?.stop(), []);

  const engine = useMemo(() => {
    engineRef.current ??= new SBABinaural();
    return engineRef.current;
  }, []);

  function vibe() { try { (navigator as any)?.vibrate?.(12); } catch {} }

  async function start(kind: Instrument) {
    setDone(false);
    setCurrent(kind);
    vibe();
    await engine.start(kind, bpm, 5);
    setPlaying(true);

    // surveille fin (on stop() auto après 5 min)
    // on poll “playing” en douceur
    const id = setInterval(() => {
      if (!engine.playing) {
        clearInterval(id);
        setPlaying(false);
        setDone(true);
      }
    }, 500);
  }

  function toggle(kind: Instrument) {
    if (playing && current === kind) {
      engine.stop();
      setPlaying(false);
    } else {
      start(kind);
    }
  }

  async function adjust(delta: number) {
    const next = Math.min(120, Math.max(30, bpm + delta));
    setBpm(next);
    if (playing && current) {
      // redémarre à la nouvelle vitesse
      engine.stop();
      await engine.start(current, next, 5);
    }
  }

  return (
    <main style={wrap}>
      <header style={hdr}>
        <a href="/exercice/sba" aria-label="Retour" style={back}>←</a>
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>Stimulation Bilatérale Alternées</h1>
          <p style={{ margin:'4px 0 0', opacity:.7, fontSize:13 }}>
            Mets un casque ou des écouteurs (pas de haut-parleur) pour bien avoir le mode binaural.
          </p>
        </div>
        <button style={gear}>⚙️</button>
      </header>

      <p style={{ margin:'6px 0 14px', opacity:.7, fontSize:13 }}>
        Séance de 5 minutes. Choisis une “bulle” pour lancer / mettre en pause.  
        Vitesse&nbsp;: {bpm} bpm
      </p>

      <section style={grid}>
        {INSTRS.map(i => {
          const active = playing && current === i.key;
          return (
            <button
              key={i.key}
              onClick={() => toggle(i.key)}
              onMouseDown={vibe}
              className="bubble"
              style={{
                ...bubble,
                outline: active ? '2px solid #7C3AED' : '1px solid rgba(0,0,0,.06)',
                position:'relative'
              }}
            >
              <div style={iconWrap}><RenderIcon icon={i.icon} size={36} /></div>
              <div style={{ fontWeight:700, fontSize:13 }}>{i.label}</div>
              {active && <span style={badge}>⏸️</span>}
              {!active && current === i.key && <span style={badge}>▶️</span>}
            </button>
          );
        })}
      </section>

      <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:12 }}>
        <button onClick={() => adjust(-5)} className="mini" style={mini}>−</button>
        <button onClick={() => adjust(+5)} className="mini" style={mini}>＋</button>
      </div>

      {done && (
        <p style={{ marginTop:14, textAlign:'center', fontWeight:700 }}>
          ✅ Séance terminée
        </p>
      )}

      <style>{css}</style>
    </main>
  );
}

/** styles */
const wrap: React.CSSProperties = { minHeight:'100dvh', background:'#F6F7FE', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a', padding:'16px 20px 24px' };
const hdr:  React.CSSProperties = { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center' };
const back: React.CSSProperties = { textDecoration:'none', color:'#111', fontSize:20 };
const gear: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer', justifySelf:'end' };
const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2, minmax(140px,1fr))', gap:16, maxWidth:520, margin:'0 auto' };
const bubble: React.CSSProperties = {
  display:'grid', placeItems:'center', gap:6, padding:'22px 10px',
  borderRadius:18, background:'linear-gradient(180deg,#A78BFA20 0%, #A78BFA12 100%)',
  boxShadow:'0 8px 18px rgba(0,0,0,.08)', cursor:'pointer'
};
const mini: React.CSSProperties = { borderRadius:999, padding:'8px 16px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' };
const badge: React.CSSProperties = { position:'absolute', top:6, right:8, fontSize:14, opacity:.9 };
const iconWrap: React.CSSProperties = {
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.95)',
  marginBottom: 6,
  boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.02)'
};
const css = `
  .bubble:active { transform:scale(.98); filter:brightness(.98) }
  .mini:active { transform:scale(.98) }
`;
