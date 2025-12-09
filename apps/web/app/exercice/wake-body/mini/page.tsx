'use client';
import { useMemo, useRef, useState, useEffect } from 'react';
import BackLink from '../../../../components/BackLink';
import { useQueryParam } from '../../../../hooks/useQueryParam';

const EXOS = [
  { key:'walk',    icon:'/icons/walk.svg',    label:'Marche pendant quelques instants si tu peux te lever', defaultSec:60 },
  { key:'armsUp',  icon:'/icons/arms-up.svg', label:'Lève les bras au-dessus de la tête et redescends-les calmement', defaultSec:60 },
  { key:'sideBend',icon:'/icons/side-bend.svg',label:'Étire-toi vers la gauche puis vers la droite', defaultSec:60 },
  { key:'squat',   icon:'/icons/squat.svg',   label:'Fais des descentes comme si tu t’asseyais sur une chaise', defaultSec:60 },
  { key:'water',   icon:'/icons/water.svg',   label:'Va te chercher un verre d’eau et inspire profondément', defaultSec:60 },
];

function useChooserHref() {
  const param = useQueryParam('from', 'hypo');
  const from = (param === 'hyper' ? 'hyper' : 'hypo') as 'hyper' | 'hypo';
  return `/exercice/wake-body?from=${from}`;
}
function vibe(ms=15){ try{ (navigator as any)?.vibrate?.(ms) }catch{} }

const isImageSrc = (s?: string) => !!s && (s.startsWith('/') || s.startsWith('http'));

export default function MiniWake() {
  const chooserHref = useChooserHref();
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, rgba(var(--theme-color-rgb),0.13) 0%, #F6F7FE 55%)`,
    []
  );

  // runningKey = exo qui tourne
  const [runningKey, setRunningKey] = useState<string | null>(null);
  // selectedKey = exo dont on affiche l'overlay (permet de garder overlay même si on stoppe)
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [leftByKey, setLeftByKey] = useState<Record<string, number>>(
    Object.fromEntries(EXOS.map(x => [x.key, x.defaultSec]))
  );

  // timerRef stocke l'id du setInterval (nombre)
  const timerRef = useRef<number | null>(null);

  // assure qu'on clear l'interval proprement
  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // démarre le timer pour exoKey (reset l'interval si besoin)
  const startTimer = (exoKey: string) => {
    // si on démarre un exo différent, on met à jour selectedKey
    setSelectedKey(exoKey);
    // clear d'abord
    clearTimer();
    setRunningKey(exoKey);

    // lance l'interval
    timerRef.current = window.setInterval(() => {
      setLeftByKey(prev => {
        const prevVal = prev[exoKey] ?? 0;
        const v = Math.max(0, prevVal - 1);
        // si arrive à 0 : on stoppe le timer mais on laisse overlayVisible (selectedKey)
        if (v === 0) {
          vibe(80);
          clearTimer();
          setRunningKey(null);
          // on laisse selectedKey (donc overlay visible) — l'utilisateur voit "Terminé" et peut réinit ou fermer
        }
        return { ...prev, [exoKey]: v };
      });
    }, 1000);
  };

  // stoppe le minuteur mais garde l'exercice sélectionné (overlay visible)
  const stopTimer = () => {
    clearTimer();
    setRunningKey(null);
    vibe(12);
    // ne modifie pas selectedKey -> overlay reste visible
  };

  // réinitialise uniquement la valeur du compteur, ne ferme rien
  // si l'exo est en cours (runningKey === exoKey), il continue en partant du temps réinit
  const resetTimer = (exoKey: string) => {
    const ex = EXOS.find(e => e.key === exoKey)!;
    setLeftByKey(prev => ({ ...prev, [exoKey]: ex.defaultSec }));
    vibe(10);
    // ne clear pas le timer : si l'exo tournait, il va continuer (à partir de la nouvelle valeur)
    // on ne touche pas selectedKey
  };

  // toggle lancer / stop : si on lance, on sélectionne aussi l'exo
  const toggle = (exoKey: string) => {
    if (runningKey === exoKey) {
      stopTimer();
    } else {
      startTimer(exoKey);
    }
    // ensure overlay selected
    setSelectedKey(exoKey);
  };

  // manuel close overlay (optionnel)
  const closeOverlay = () => {
    // ne coupe pas le timer automatiquement ; ici on choisit de fermer l'overlay tout en gardant timer arrêté.
    // si tu veux aussi arrêter le timer en fermant, décommente la ligne clearTimer();
    // clearTimer();
    setSelectedKey(null);
    setRunningKey(null);
  };

  // compute current display
  const current = EXOS.find(e => e.key === selectedKey) ?? null;
  const currentLeft = selectedKey ? (leftByKey[selectedKey] ?? 0) : 0;
  const mm = String(Math.floor(currentLeft/60)).padStart(2,'0');
  const ss = String(currentLeft%60).padStart(2,'0');

  // cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' }}>
      <style>{miniCss}</style>

      <header style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <BackLink href={chooserHref} style={{ justifySelf: 'start' }} />
        <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Mini exercices</h1>
        <div />
      </header>

      <section style={grid}>
        {EXOS.map(x => {
          const left = leftByKey[x.key] ?? x.defaultSec;
          const running = runningKey === x.key;
          const mmx = String(Math.floor(left/60)).padStart(2,'0');
          const ssx = String(left%60).padStart(2,'0');
          return (
            <article key={x.key} style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={icon}>
                  {isImageSrc(x.icon) ? <img src={x.icon} alt={x.label} width={36} height={36} /> : <span>{x.icon}</span>}
                </div>
                <div>
                  <div style={{ fontWeight:700 }}>{x.label}</div>
                  <div style={{ opacity:.6, fontSize:12 }}>{mmx}:{ssx}</div>
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { toggle(x.key); }} style={btnPrimary(running)}>{running ? 'Stop' : 'Lancer'}</button>
                <button onClick={() => { resetTimer(x.key); }} style={btnGhost}>Réinit</button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Overlay visible au-dessus (z-index élevé) — pointer-events: none permet les clics à travers sauf sur .overlay-card */}
      {selectedKey && current && (
        <div className="exo-overlay">
          <div className="overlay-card" role="dialog" aria-live="polite" aria-label={current.label}>
            <button className="overlay-close" onClick={closeOverlay} aria-label="Fermer">✕</button>

            <div className="overlay-icon-wrap">
              {isImageSrc(current.icon) ? (
                <img src={current.icon} alt={current.label} className="overlay-icon" />
              ) : (
                <span style={{ fontSize:120 }}>{current.icon}</span>
              )}
            </div>

            <div className="overlay-label">{current.label}</div>
            <div className="overlay-timer">{mm}:{ss}</div>
          </div>
        </div>
      )}

      <div style={{ height:28 }} />
    </main>
  );
}

/* --- Styles --- */
const grid: React.CSSProperties = { display:'grid', gap:12, maxWidth:780, margin:'8px auto 0', padding:'0 20px' };
const card: React.CSSProperties = {
  display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:12,
  border:'1px solid rgba(0,0,0,.06)', borderRadius:18, padding:'12px 14px', background:'#fff',
  boxShadow:'0 8px 18px rgba(0,0,0,.06)'
};
const icon: React.CSSProperties = { width:44, height:44, borderRadius:14, display:'grid', placeItems:'center', background:'rgba(var(--theme-color-rgb),0.2)' };
const btnPrimary = (active:boolean): React.CSSProperties => ({
  padding:'10px 14px', borderRadius:12, border:'none',
  background: active ? '#ef4444' : 'var(--theme-color)',
  color:'#fff', fontWeight:700, cursor:'pointer'
});
const btnGhost: React.CSSProperties = { padding:'10px 12px', borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' };

const miniCss = `
/* overlay covers screen visually but does not block clicks outside .overlay-card */
.exo-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none; /* allow clicks through overlay to underlying buttons */
  z-index: 1000;        /* on top of everything visually */
}

/* central card is interactive */
.overlay-card {
  pointer-events: auto; /* card captures interactions (e.g. close button) */
  position: relative;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(6px);
  border-radius: 18px;
  padding: 32px 28px;
  display:flex;
  flex-direction: column;
  align-items: center;
  gap:14px;
  box-shadow: 0 22px 48px rgba(0,0,0,.2);
  text-align: center;
  min-width: 280px;
}

/* close button top-right inside card */
.overlay-close {
  position: absolute;
  right: 12px;
  top: 10px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

/* icon */
.overlay-icon {
  width: 140px;
  height: 140px;
  object-fit: contain;
  animation: pulse 1.6s infinite ease-in-out;
}
.overlay-icon-wrap { height: 140px; display:grid; place-items:center; }

/* label + timer */
.overlay-label {
  font-family: 'Fredoka One', Inter, sans-serif;
  font-size: 16px;
  color: #0f172a;
  line-height: 1.3;
  max-width: 420px;
}

.overlay-timer {
  font-family: 'Fredoka One', Inter, sans-serif;
  font-size: 28px;
  background: #F3E8FF;
  color: #0f172a;
  padding: 10px 18px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(167,139,250,.15);
}

/* pulsing animation */
@keyframes pulse {
  0%,100% { transform: scale(1); opacity:1; }
  50% { transform: scale(1.06); opacity: .94; }
}

/* visually enhance underlying buttons when overlay present:
   keep them readable and prominent (accessibility) */
article { position: relative; z-index: 1; }
button { z-index: 2; }

/* small screen tweaks */
@media (max-width:420px) {
  .overlay-icon { width: 110px; height: 110px; }
  .overlay-card { padding: 22px; min-width: 220px; }
}
`;
