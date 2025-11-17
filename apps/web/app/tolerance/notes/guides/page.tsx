'use client';

import { useEffect, useMemo, useState } from 'react';

type QA = { id: string; q: string };

const QUESTIONS: QA[] = [
  { id: 'q1', q: 'Qu’est-ce qui s’est passé juste avant que tu te sentes comme ça ?' },
  { id: 'q2', q: 'Y a-t-il des situations où tu sens que tu sors de ta fenêtre ? Donne un exemple.' },
  { id: 'q3', q: 'Qu’est-ce qui, d’habitude, t’aide un peu à te réguler ?' },
  { id: 'q4', q: 'Y a-t-il des moments plus compliqués que d’autres / ou plus faciles ?' },
  { id: 'q5', q: 'Quels signaux ressens-tu dans ton corps quand ça monte ?' },
  { id: 'q6', q: 'Si le récit te chamboule, vers quel exercice pourrais-tu aller maintenant ?' },
];

const LS_KEY = 'tolerance_guided_notes';

function vibe(ms = 12) {
  try { (navigator as any)?.vibrate?.(ms); } catch {}
}

export default function GuidedQuestionsPage() {
  const theme = '#A78BFA';

  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${theme}22 0%, #F6F7FE 55%)`,
    []
  );

  // réponses persistées
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(answers)); } catch {}
  }, [answers]);

  // carte en cours de flip + brouillon
  const [flipped, setFlipped] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  function openCard(id: string) {
    const a = answers[id] ?? '';
    setDraft(a);
    setFlipped(id);
    vibe();
  }
  function closeCard() {
    setFlipped(null);
    setDraft('');
  }
  function saveCard(id: string) {
    setAnswers((p) => ({ ...p, [id]: draft.trim() }));
    closeCard();
    vibe(18);
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: bg,
        fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
        color: '#0f172a',
      }}
    >
      <style>{css}</style>

      {/* Header simple + retour historique pour éviter les erreurs de route */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          padding: '16px 20px',
        }}
      >
        <button
          onClick={() => history.back()}
          aria-label="Retour"
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
        >
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Questions guidées</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>
            Quelques questions pour y voir plus clair
          </p>
        </div>
        <div />
      </header>

      {/* Grille de cartes */}
      <section
        style={{
          maxWidth: 900,
          margin: '8px auto 0',
          padding: '0 20px 20px',
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {QUESTIONS.map((it) => {
          const isFlip = flipped === it.id;
          const hasAnswer = !!(answers[it.id]?.trim());
          return (
            <div key={it.id} className={`flip-wrap ${isFlip ? 'flipped' : ''}`}>
              {/* face */}
              <article
                className="card face"
                onClick={() => openCard(it.id)}
                role="button"
                aria-label="Ouvrir la question"
                style={{ borderColor: hasAnswer ? '#a78bfa55' : 'rgba(0,0,0,.06)' }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>❓</div>
                <div style={{ lineHeight: 1.25 }}>{it.q}</div>
                {hasAnswer && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      opacity: 0.7,
                      borderTop: '1px dashed #ddd',
                      paddingTop: 8,
                    }}
                  >
                    Réponse enregistrée
                  </div>
                )}
              </article>

              {/* dos */}
              <article className="card back">
                <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
                  {it.q}
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écris ta réponse ici…"
                  rows={6}
                  style={ta}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => saveCard(it.id)} style={btnPrimary(theme)}>
                    Enregistrer & retourner
                  </button>
                  <button onClick={closeCard} style={btnGhost}>
                    Annuler
                  </button>
                </div>
              </article>
            </div>
          );
        })}
      </section>
    </main>
  );
}

/* styles */
const ta: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '10px 12px',
  resize: 'vertical',
  outline: 'none',
  background: '#fff',
};

const btnPrimary = (c: string): React.CSSProperties => ({
  padding: '10px 12px',
  borderRadius: 12,
  border: 'none',
  background: c,
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
});

const btnGhost: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
};

const css = `
.flip-wrap{
  perspective: 1000px;
  position: relative;
  height: 190px;
}
.card{
  position:absolute; inset:0;
  background:#E9D5FF55;
  border:1px solid rgba(0,0,0,.06);
  border-radius:18px;
  box-shadow:0 8px 18px rgba(0,0,0,.06);
  padding:14px;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  transition: transform .6s cubic-bezier(.2,.7,.2,1);
  display:flex; flex-direction:column; justify-content:flex-start;
}
.face{ transform: rotateY(0deg); cursor:pointer; }
.back{ background:#fff; transform: rotateY(180deg); }

.flip-wrap.flipped .face{ transform: rotateY(180deg); }
.flip-wrap.flipped .back{ transform: rotateY(360deg); }
`;
