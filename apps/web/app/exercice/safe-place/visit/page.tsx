'use client';

import { useEffect, useState } from 'react';
import BackLink from '../../../../components/BackLink';
import { logActivity } from '../../../../lib/patientTracking';
import { deleteSafePlace, fetchSafePlaces, type SafePlace } from '../../../../lib/safePlaces';

function vibe(ms = 12) {
  try { navigator.vibrate?.(ms); } catch {}
}

export default function VisitSafePlace() {
  const [items, setItems] = useState<SafePlace[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHighlight(new URL(window.location.href).searchParams.get('highlight'));
    void fetchSafePlaces()
      .then((safePlaces) => {
        if (!cancelled) setItems(safePlaces);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Impossible de charger tes lieux sûrs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!highlight || loading) return;
    document.getElementById(`sp-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight, loading]);

  async function remove(item: SafePlace) {
    vibe();
    if (!window.confirm('Supprimer ce lieu sûr ? Cette action est définitive.')) return;
    setDeletingId(item.id);
    setError(null);
    try {
      await deleteSafePlace(item.id);
      setItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      if (String(openId) === String(item.id)) setOpenId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer ce lieu sûr.');
    } finally {
      setDeletingId(null);
    }
  }

  async function openDetails(item: SafePlace) {
    vibe();
    setOpenId(item.id);
    try {
      await logActivity({ category: 'SAFE_PLACE', subType: 'Visite', detail: item.name });
    } catch {}
  }

  const selected = openId == null ? null : items.find((item) => String(item.id) === String(openId));

  return (
    <main style={pageStyle}>
      <style>{css}</style>
      <header style={headerStyle}>
        <BackLink href="/exercice/safe-place" style={{ justifySelf: 'start' }} />
        <h1 style={titleStyle}>Accès à mon lieu sûr</h1>
        <a href="/exercice/safe-place/build" style={newButtonStyle} onMouseDown={() => vibe()}>+ Nouveau</a>
      </header>

      {error ? <p role="alert" style={errorStyle}>{error}</p> : null}
      {loading ? (
        <p style={statusStyle}>Chargement de tes lieux sûrs…</p>
      ) : items.length === 0 ? (
        <section style={emptyStyle}>
          <p style={{ margin: '0 0 12px', fontWeight: 700 }}>Tu n’as pas encore créé de lieu sûr.</p>
          <a href="/exercice/safe-place/build" style={primaryButtonStyle}>Créer mon premier lieu</a>
        </section>
      ) : (
        <section style={listStyle}>
          {items.map((item) => {
            const isHighlighted = String(item.id) === highlight;
            const answeredCount = item.answers.filter((entry) => entry.answer.trim()).length;
            return (
              <article key={item.id} id={`sp-${item.id}`} className={isHighlighted ? 'safe-place-card pulse' : 'safe-place-card'} style={cardStyle(isHighlighted)}>
                <div style={cardHeaderStyle}>
                  <div style={circleStyle}>{(item.name || 'L').slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={cardTitleStyle}>{item.name || 'Mon lieu sûr'}</h2>
                    <p style={metaStyle}>{new Date(item.createdAt).toLocaleString('fr-FR')} · {answeredCount} réponse{answeredCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={actionsStyle}>
                  <button type="button" style={detailsButtonStyle} onClick={() => openDetails(item)}>Voir le détail</button>
                  <button type="button" style={deleteButtonStyle} disabled={deletingId === item.id} onClick={() => remove(item)}>
                    {deletingId === item.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selected ? (
        <div className="safe-place-modal" role="presentation" onClick={() => setOpenId(null)}>
          <section className="safe-place-sheet" role="dialog" aria-modal="true" aria-labelledby="safe-place-detail-title" onClick={(event) => event.stopPropagation()}>
            <div style={detailHeaderStyle}>
              <div>
                <p style={eyebrowStyle}>Mon lieu sûr</p>
                <h2 id="safe-place-detail-title" style={{ margin: 0 }}>{selected.name}</h2>
              </div>
              <button type="button" style={detailsButtonStyle} onClick={() => setOpenId(null)}>Fermer</button>
            </div>
            <div style={answersStyle}>
              {selected.answers.map((entry, index) => (
                <article key={`${entry.question}-${index}`} style={answerCardStyle}>
                  <h3 style={questionStyle}><span style={numberStyle}>{index + 1}</span>{entry.question}</h3>
                  <p style={answerStyle}>{entry.answer.trim() || 'Aucune réponse renseignée.'}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100dvh', background: '#F6F7FE', color: '#0f172a', padding: 'max(16px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom))' };
const headerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', alignItems: 'center', gap: 10, width: 'min(860px, 100%)', margin: '0 auto 20px' };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 'clamp(19px, 4vw, 24px)', textAlign: 'center' };
const newButtonStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 12, background: 'var(--theme-color)', color: '#fff', textDecoration: 'none', fontWeight: 700 };
const statusStyle: React.CSSProperties = { maxWidth: 860, margin: '24px auto', textAlign: 'center', color: '#64748b' };
const errorStyle: React.CSSProperties = { maxWidth: 860, margin: '0 auto 16px', padding: '12px 14px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c' };
const emptyStyle: React.CSSProperties = { maxWidth: 700, margin: '24px auto', padding: 20, borderRadius: 18, background: '#fff', textAlign: 'center', boxShadow: '0 8px 18px rgba(0,0,0,.06)' };
const primaryButtonStyle: React.CSSProperties = { display: 'inline-block', padding: '10px 14px', borderRadius: 12, background: 'var(--theme-color)', color: '#fff', textDecoration: 'none', fontWeight: 700 };
const listStyle: React.CSSProperties = { maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 };
const cardStyle = (highlighted: boolean): React.CSSProperties => ({ padding: 18, borderRadius: 22, background: '#fff', border: highlighted ? '2px solid var(--theme-color)' : '1px solid #e5e7eb', boxShadow: highlighted ? '0 12px 28px rgba(var(--theme-color-rgb),.22)' : '0 8px 18px rgba(0,0,0,.06)' });
const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 };
const circleStyle: React.CSSProperties = { width: 46, height: 46, flex: '0 0 46px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(var(--theme-color-rgb),.18)', fontWeight: 800 };
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18, overflowWrap: 'anywhere' };
const metaStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontSize: 12 };
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const detailsButtonStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 12, border: '1px solid #d8d3ee', background: '#fff', color: '#312e81', fontWeight: 700, cursor: 'pointer' };
const deleteButtonStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 12, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' };
const detailHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 };
const eyebrowStyle: React.CSSProperties = { margin: '0 0 5px', color: '#7c3aed', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' };
const answersStyle: React.CSSProperties = { display: 'grid', gap: 12 };
const answerCardStyle: React.CSSProperties = { padding: 14, borderRadius: 16, border: '1px solid #e7e5f3', background: '#fafaff' };
const questionStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 9, margin: '0 0 8px', color: '#312e81', fontSize: 15, lineHeight: 1.4 };
const numberStyle: React.CSSProperties = { flex: '0 0 24px', width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 99, background: '#ede9fe', color: '#6d28d9', fontSize: 12 };
const answerStyle: React.CSSProperties = { margin: 0, paddingLeft: 33, whiteSpace: 'pre-wrap', color: '#334155', lineHeight: 1.55 };

const css = `
  .pulse { animation: safe-place-pulse 1.2s ease 2; }
  @keyframes safe-place-pulse { 50% { transform: scale(1.01); } }
  .safe-place-modal { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; background: rgba(15,23,42,.42); backdrop-filter: blur(5px); }
  .safe-place-sheet { width: min(760px, 100%); max-height: min(86dvh, 900px); overflow: auto; padding: 20px; border-radius: 22px; background: #fff; box-shadow: 0 24px 60px rgba(15,23,42,.25); }
  button:disabled { opacity: .6; cursor: wait; }
  @media (max-width: 540px) { .safe-place-sheet { padding: 15px; } }
`;
