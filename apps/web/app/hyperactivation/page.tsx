'use client';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import BackLink from '../../components/BackLink';
import HomeButton from '../../components/HomeButton';
import { tintColor, useThemeColor, withAlpha } from '../../components/theme';
import { HYPER_EXERCISES } from '../../lib/exerciseCatalog';
import {
  addLocalFavoriteKey,
  createPatientFavorite,
  deletePatientFavorite,
  fetchPatientFavorites,
  getFavoriteEventName,
  getLocalFavoriteKeys,
  removeLocalFavoriteKey,
} from '../../lib/patientTracking';
import { isPatientSession } from '../../lib/session';

export default function HyperactivationPage() {
  const color = useThemeColor();
  const [favorites, setFavorites] = useState<Record<string, number>>({});
  const [favoriteBusyKey, setFavoriteBusyKey] = useState<string | null>(null);

  const bg = useMemo(() => `radial-gradient(1200px 800px at 50% -10%, ${tintColor(color,0.9)} 0%, #F6F7FE 55%)`, [color]);

  useEffect(() => {
    setFavorites(
      getLocalFavoriteKeys().reduce<Record<string, number>>((acc, key) => {
        acc[key] = -1;
        return acc;
      }, {})
    );

    if (!isPatientSession()) return;

    let cancelled = false;

    async function loadFavorites() {
      try {
        const items = await fetchPatientFavorites();
        if (cancelled) return;
        setFavorites(
          items.reduce<Record<string, number>>((acc, item) => {
            const card = HYPER_EXERCISES.find((entry) => entry.label === item.exercise.title);
            if (card) acc[card.key] = item.id;
            return acc;
          }, {})
        );
      } catch {}
    }

    void loadFavorites();

    const syncLocalFavorites = () => {
      setFavorites((current) => {
        const next = { ...current };
        const keys = new Set(getLocalFavoriteKeys());

        for (const key of Object.keys(next)) {
          if (next[key] === -1 && !keys.has(key)) {
            delete next[key];
          }
        }

        for (const key of keys) {
          if (!(key in next)) next[key] = -1;
        }

        return next;
      });
    };

    window.addEventListener(getFavoriteEventName(), syncLocalFavorites);
    window.addEventListener('storage', syncLocalFavorites);

    return () => {
      cancelled = true;
      window.removeEventListener(getFavoriteEventName(), syncLocalFavorites);
      window.removeEventListener('storage', syncLocalFavorites);
    };
  }, []);

  function pressFeedback(){ try{ (navigator as any)?.vibrate?.(15) }catch{} }

  async function toggleFav(key: string) {
    if (!isPatientSession() || favoriteBusyKey) return;

    const card = HYPER_EXERCISES.find((entry) => entry.key === key);
    if (!card) return;

    try {
      setFavoriteBusyKey(key);
      if (favorites[key]) {
        removeLocalFavoriteKey(key);
        if (favorites[key] > 0) {
          await deletePatientFavorite(favorites[key]);
        }
        setFavorites((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
      } else {
        addLocalFavoriteKey(key);
        setFavorites((current) => ({ ...current, [key]: -1 }));
        const favorite = await createPatientFavorite({
          key: card.key,
          title: card.label,
          description: card.href,
        });
        setFavorites((current) => ({ ...current, [key]: favorite.id }));
      }
    } catch {
    } finally {
      setFavoriteBusyKey(null);
    }
  }

  function go(href: string) {
    pressFeedback();
    const url = href.includes('?') ? `${href}&from=hyper` : `${href}?from=hyper`;
    window.location.href = url;
  }

  function randomChoice() {
    pressFeedback();
    const pick = HYPER_EXERCISES[Math.floor(Math.random() * HYPER_EXERCISES.length)];
    document.body.classList.add('shuffle');
    const url = pick.href.includes('?') ? `${pick.href}&from=hyper` : `${pick.href}?from=hyper`;
    setTimeout(() => { window.location.href = url; }, 400);
  }

  return (
    <main style={{ minHeight:'100dvh', background:bg, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color:'#0f172a' }}>
      <style>{css}</style>

      <header className="zone-header" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' }}>
        <BackLink href="/app" style={{ justifySelf: 'start' }} />
        <h1 className="zone-title" style={{ margin:0, fontSize:20, textAlign:'center' }}>Exercices hyperactivation</h1>
        <div style={headerActions}><HomeButton /><button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button></div>
      </header>

      <p className="zone-intro" style={{ margin:'0 auto 12px', opacity:.7, fontSize:16, textAlign:'center', maxWidth:700, padding:'0 20px' }}>
        Sélectionne un exercice pour qu’on revienne à ta fenêtre de tolérance.
      </p>

      <section style={grid}>
        {HYPER_EXERCISES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => go(c.href)}
            onMouseDown={pressFeedback}
            onTouchStart={pressFeedback}
            className="tile"
            style={{ ...tile(color), position:'relative' }}
          >
            <span
              role="button"
              aria-label={favorites[c.key] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              title="Favori"
              onClick={(e) => { e.stopPropagation(); void toggleFav(c.key); }}
              style={{
                position:'absolute',
                right:10,
                bottom:10,
                fontSize:16,
                color: favorites[c.key] ? '#111111' : '#94a3b8',
                opacity: favoriteBusyKey === c.key ? 0.45 : 1,
                cursor: favoriteBusyKey === c.key ? 'default' : 'pointer'
              }}
            >
              {favorites[c.key] ? '★' : '☆'}
            </span>

            <div style={{ marginBottom: 10 }}>
              <Image
                src={c.icon ?? '/icons/default.svg'}
                alt={c.label}
                width={48}
                height={48}
                style={{ width: 48, height: 48, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontWeight:700, fontSize:16 }}>{c.label}</div>
          </button>
        ))}
      </section>

      <div className="zone-help" style={{ display:'flex', gap:12, justifyContent:'center', margin:'10px 0 90px', padding:'0 20px' }}>
        <a href="/sos?from=hyper" style={btnSecondary}>J’ai besoin d’aide</a>
      </div>

      <button type="button" onClick={randomChoice} aria-label="Choix aléatoire" className="zone-fab" style={fab(color)}>🎲</button>
    </main>
  );
}

const gearBtn: React.CSSProperties = { border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 10px', cursor:'pointer' };
const headerActions: React.CSSProperties = { display:'flex', gap:8, justifySelf:'end' };
const grid: React.CSSProperties = { display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', maxWidth:900, margin:'10px auto 0', padding:'0 20px' };
const tile = (color:string): React.CSSProperties => ({
  borderRadius:22,
  border:'1px solid rgba(0,0,0,.04)',
  background:`linear-gradient(180deg, ${withAlpha(color,0.12)} 0%, ${withAlpha(color,0.06)} 100%)`,
  boxShadow:`0 6px 14px ${withAlpha(color,0.25)}`,
  textAlign:'center',
  padding:'28px 18px',
  transition:'transform .12s ease, box-shadow .12s ease, filter .12s ease',
  outline:'none'
});
const btnSecondary: React.CSSProperties = { padding:'12px 18px', borderRadius:16, border:'1px solid #e5e7eb', background:'#fff', color:'#0f172a', fontWeight:700, textDecoration:'none', boxShadow:'0 4px 10px rgba(0,0,0,.04)' };
const fab = (c:string): React.CSSProperties => ({ position:'fixed', right:20, bottom:20, width:70, height:70, borderRadius:'50%', border:'none', background:c, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 12px 26px rgba(0,0,0,.18)' });
const css = `
  .tile:active { transform: scale(0.975); filter: brightness(0.98); }
  @media (hover:hover){ .tile:hover{ transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.08); } }
  .shuffle * { transition: transform .25s ease; }

  @media (max-width: 760px){
    .zone-header{
      grid-template-columns: 1fr;
      gap: 12px;
      justify-items: center;
      text-align: center;
    }

    .zone-title{
      font-size: 18px !important;
    }

    .zone-intro{
      font-size: 15px !important;
      margin-bottom: 16px !important;
    }

    .zone-help{
      flex-direction: column;
      margin-bottom: 92px !important;
    }

    .zone-help a{
      width: 100%;
      max-width: 360px;
      text-align: center;
    }

    .tile{
      min-height: 168px;
    }

    .zone-fab{
      right: 16px !important;
      bottom: 16px !important;
      width: 60px !important;
      height: 60px !important;
      font-size: 22px !important;
    }
  }
`;
