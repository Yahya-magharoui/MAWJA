'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackLink from '../../../../components/BackLink';
import HomeButton from '../../../../components/HomeButton';
import { logActivity } from '../../../../lib/patientTracking';
import { createSafePlace, SAFE_PLACE_QUESTIONS, type SafePlaceAnswer } from '../../../../lib/safePlaces';

const DRAFT_KEY = 'safePlaceBuildDraftV3';
const ANSWER_MAX_LENGTH = 2000;

function vibe(ms = 14) {
  try { navigator.vibrate?.(ms); } catch {}
}

function tint(hex: string, ratio: number) {
  const normalized = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
  const mix = (channel: number) => Math.round(channel + (255 - channel) * ratio);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function emptyAnswers() {
  return SAFE_PLACE_QUESTIONS.map((question) => ({ question, answer: '' }));
}

export default function BuildSafePlace() {
  const router = useRouter();
  const [themeColor, setThemeColor] = useState('#A78BFA');
  const [answers, setAnswers] = useState<SafePlaceAnswer[]>(emptyAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('themeColor');
    if (storedTheme) setThemeColor(storedTheme);
    try {
      const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (Array.isArray(draft) && draft.length === SAFE_PLACE_QUESTIONS.length) {
        setAnswers(SAFE_PLACE_QUESTIONS.map((question, index) => ({
          question,
          answer: typeof draft[index]?.answer === 'string' ? draft[index].answer : '',
        })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }, [answers]);

  const background = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${tint(themeColor, 0.88)} 0%, #F6F7FE 55%)`,
    [themeColor]
  );

  function updateAnswer(index: number, value: string) {
    setAnswers((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, answer: value } : entry));
  }

  async function saveSafePlace() {
    if (busy) return;
    const normalizedAnswers = answers.map((entry) => ({ question: entry.question, answer: entry.answer.trim() }));
    if (!normalizedAnswers.some((entry) => entry.answer)) {
      setError('Réponds à au moins une question avant d’enregistrer ton lieu sûr.');
      return;
    }

    setBusy(true);
    setError(null);
    vibe();
    try {
      const place = await createSafePlace({
        name: normalizedAnswers[4]?.answer || 'Mon lieu sûr',
        answers: normalizedAnswers,
      });
      try {
        await logActivity({ category: 'SAFE_PLACE', subType: 'Construction', detail: place.name });
      } catch {}
      window.sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/exercice/safe-place/visit?highlight=${encodeURIComponent(String(place.id))}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer ton lieu sûr.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ ...pageStyle, background }}>
      <style>{css}</style>
      <header style={headerStyle}>
        <BackLink href="/exercice/safe-place" style={{ justifySelf: 'start' }} />
        <h1 style={titleStyle}>Construction de mon lieu sûr</h1>
        <div style={headerActionsStyle}><HomeButton /><button aria-label="Paramètres" title="Paramètres" style={gearButtonStyle}>⚙️</button></div>
      </header>

      <section style={introStyle}>
        <p style={{ margin: 0 }}>Avance à ton rythme. Tu peux répondre avec quelques mots ou avec une description plus détaillée.</p>
      </section>

      <section className="safe-place-form" style={formStyle} aria-label="Questions pour construire mon lieu sûr">
        {answers.map((entry, index) => (
          <article key={entry.question} style={cardStyle}>
            <label htmlFor={`safe-place-answer-${index}`} style={questionStyle}>
              <span style={numberStyle}>{index + 1}</span>
              <span>{entry.question}</span>
            </label>
            <textarea
              id={`safe-place-answer-${index}`}
              value={entry.answer}
              maxLength={ANSWER_MAX_LENGTH}
              rows={4}
              placeholder="Écris ta réponse ici…"
              onFocus={() => vibe(8)}
              onChange={(event) => updateAnswer(index, event.target.value)}
              style={textareaStyle}
            />
            <span style={counterStyle}>{entry.answer.length}/{ANSWER_MAX_LENGTH}</span>
          </article>
        ))}

        <aside style={closingStyle}>
          <Image src="/icons/lieusur.png" alt="Icône du lieu sûr" width={96} height={96} />
          <p style={{ margin: 0 }}>Tu pourras revenir consulter ce lieu aussi souvent que nécessaire depuis « Accès à mon lieu sûr ».</p>
        </aside>
        {error ? <p role="alert" style={errorStyle}>{error}</p> : null}
        <button type="button" onClick={saveSafePlace} disabled={busy} style={saveButtonStyle}>
          {busy ? 'Enregistrement…' : 'Enregistrer mon lieu sûr'}
        </button>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100dvh', color: '#0f172a', padding: 'max(16px, env(safe-area-inset-top)) 14px max(32px, env(safe-area-inset-bottom))' };
const headerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', alignItems: 'center', gap: 10, width: 'min(720px, 100%)', margin: '0 auto 18px' };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', textAlign: 'center' };
const gearButtonStyle: React.CSSProperties = { border: '1px solid #e5e7eb', background: '#fff', borderRadius: 12, padding: 8, cursor: 'pointer' };
const headerActionsStyle: React.CSSProperties = { display: 'flex', gap: 8, justifySelf: 'end' };
const introStyle: React.CSSProperties = { width: 'min(680px, 100%)', margin: '0 auto 16px', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,.78)', color: '#475569', lineHeight: 1.5 };
const formStyle: React.CSSProperties = { width: 'min(680px, 100%)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 };
const cardStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.94)', border: '1px solid rgba(167,139,250,.22)', boxShadow: '0 10px 24px rgba(76,29,149,.07)' };
const questionStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: '#312e81' };
const numberStyle: React.CSSProperties = { width: 28, height: 28, flex: '0 0 28px', display: 'grid', placeItems: 'center', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontSize: 14 };
const textareaStyle: React.CSSProperties = { width: '100%', resize: 'vertical', minHeight: 104, padding: '12px 14px', borderRadius: 14, border: '1px solid #d8d3ee', background: '#fafaff', color: '#0f172a', font: 'inherit', lineHeight: 1.5 };
const counterStyle: React.CSSProperties = { justifySelf: 'end', color: '#64748b', fontSize: 12 };
const closingStyle: React.CSSProperties = { display: 'grid', justifyItems: 'center', gap: 8, padding: 18, textAlign: 'center', color: '#475569', lineHeight: 1.5 };
const errorStyle: React.CSSProperties = { margin: 0, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c' };
const saveButtonStyle: React.CSSProperties = { justifySelf: 'center', minWidth: 240, border: 0, borderRadius: 999, padding: '13px 22px', background: 'var(--theme-color)', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 22px rgba(var(--theme-color-rgb),.3)' };

const css = `
  .safe-place-form textarea:focus { outline: 3px solid rgba(var(--theme-color-rgb), .18); border-color: var(--theme-color); }
  .safe-place-form button:disabled { opacity: .62; cursor: wait; }
  @media (max-width: 520px) { .safe-place-form article { padding: 15px !important; border-radius: 17px !important; } }
`;
