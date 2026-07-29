'use client';
import { useEffect, useMemo, useState } from 'react';
import AuthRequiredNotice from '../../../components/AuthRequiredNotice';
import BackLink from '../../../components/BackLink';
import { useThemeColor, withAlpha } from '../../../components/theme';
import { useSessionInfo } from '../../../lib/session';
import { EXERCISE_CATALOG, findExerciseCardByLabel, type ExerciseCard } from '../../../lib/exerciseCatalog';
import {
  deletePatientFavorite,
  fetchPatientFavorites,
  getFavoriteEventName,
  getLocalFavoriteKeys,
  removeLocalFavoriteKey,
  type PatientFavorite,
} from '../../../lib/patientTracking';

type FavoriteCard = ExerciseCard & { favoriteId: number | null };

export default function RoutinePage(){
  const session = useSessionInfo();
  const authenticated = session?.status === 'registered' && session.role === 'PATIENT';
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useThemeColor();
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${withAlpha(theme, 0.13)} 0%, #F6F7FE 55%)`,
    [theme]
  );
  const tileStyle = useMemo(() => tile(theme), [theme]);

  useEffect(()=>{
    if (session && !authenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    if (!authenticated) return;

    let cancelled = false;

    async function loadFavorites() {
      try {
        setLoading(true);
        const items = await fetchPatientFavorites();
        if (cancelled) return;
        const remoteCards = items.map(toFavoriteCard).filter((card): card is FavoriteCard => Boolean(card));
        const localCards = getLocalFavoriteCards();
        setFavorites(mergeFavoriteCards(localCards, remoteCards));
      } catch {
        if (!cancelled) setFavorites(getLocalFavoriteCards());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFavorites();

    const syncLocalFavorites = () => {
      setFavorites((current) => mergeFavoriteCards(getLocalFavoriteCards(), current));
    };

    window.addEventListener(getFavoriteEventName(), syncLocalFavorites);
    window.addEventListener('storage', syncLocalFavorites);

    return () => {
      cancelled = true;
      window.removeEventListener(getFavoriteEventName(), syncLocalFavorites);
      window.removeEventListener('storage', syncLocalFavorites);
    };
  },[authenticated, session]);

  async function remove(card: FavoriteCard){
    if (!confirm('Retirer cet exercice des favoris ?')) return;
    removeLocalFavoriteKey(card.key);
    if (card.favoriteId) {
      try {
        await deletePatientFavorite(card.favoriteId);
      } catch {}
    }
    setFavorites((current) => current.filter((entry) => entry.key !== card.key));
  }

  return (
    <main style={{ ...wrap, background: bg }}>
      <header style={hdr}>
        <BackLink href="/tolerance" style={backBtn} />
        <h1 style={{ margin:0, fontSize:20 }}>Ma routine</h1>
        <div />
      </header>

      <p style={{ margin:'0 20px 10px', opacity:.7 }}>Pratique les exercices que tu as ajoutés en favoris</p>

      {session && !authenticated ? <AuthRequiredNotice subject="ta routine" /> : null}
      {authenticated ? (
      <div style={{ padding:'0 20px', maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14 }}>
        {loading && <div style={{ opacity:.6 }}>Chargement des favoris…</div>}
        {!loading && favorites.length === 0 && <div style={{ opacity:.6 }}>Aucun favori pour le moment.</div>}
        {!loading && favorites.map(c=>(
          <a key={`${c.key}-${c.favoriteId ?? 'local'}`} href={c.href} style={tileStyle}>
            <span style={{ position:'absolute', right:10, top:10, fontSize:18, cursor:'pointer', color:'#111111' }} onClick={(e)=>{ e.preventDefault(); void remove(c); }}>★</span>
            <div style={{ marginBottom:8 }}>
              {c.icon ? <img src={c.icon} alt="" aria-hidden="true" style={{ width: 42, height: 42, objectFit: 'contain' }} /> : <span style={{ fontSize:36 }}>✨</span>}
            </div>
            <div style={{ fontWeight:700 }}>{c.label}</div>
          </a>
        ))}
      </div>
      ) : null}
    </main>
  );
}

const wrap = { minHeight:'100dvh', fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', color:'#0f172a' } as const;
const hdr  = { display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', padding:'16px 20px' } as const;
const backBtn = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#111' } as const;

const tile = (color: string): React.CSSProperties => ({
  position:'relative',
  display:'grid', placeItems:'center', gap:6,
  textDecoration:'none', color:'#0f172a',
  borderRadius:18, padding:'26px 12px',
  background:`linear-gradient(180deg, ${withAlpha(color,0.16)} 0%, ${withAlpha(color,0.07)} 100%)`,
  boxShadow:`0 8px 18px ${withAlpha(color,0.25)}`
});

function toFavoriteCard(favorite: PatientFavorite): FavoriteCard | null {
  const matchingCard = findExerciseCardByLabel(favorite.exercise.title)
    ?? EXERCISE_CATALOG.find((card) => card.href === favorite.exercise.description);

  if (!matchingCard) return null;

  return {
    ...matchingCard,
    favoriteId: favorite.id,
  };
}

function getLocalFavoriteCards(): FavoriteCard[] {
  return getLocalFavoriteKeys()
    .map<FavoriteCard | null>((key) => {
      const card = EXERCISE_CATALOG.find((entry) => entry.key === key);
      return card ? { ...card, favoriteId: null } : null;
    })
    .filter((card): card is FavoriteCard => Boolean(card));
}

function mergeFavoriteCards(primary: FavoriteCard[], secondary: FavoriteCard[]) {
  const byKey = new Map<string, FavoriteCard>();

  for (const card of secondary) byKey.set(card.key, card);
  for (const card of primary) {
    const existing = byKey.get(card.key);
    byKey.set(card.key, existing ? { ...card, favoriteId: existing.favoriteId ?? card.favoriteId } : card);
  }

  return Array.from(byKey.values());
}
