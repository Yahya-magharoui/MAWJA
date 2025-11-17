'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/** — thème — */
function tint(hex: string, t: number) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  const to = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
}

/** — sections du plan — */
type SectionId = 'signes' | 'actions' | 'personnes' | 'soignants';
type PlanData = Record<SectionId, string[]>;

const SECTIONS: { id: SectionId; icon: string; title: string; helper?: string }[] = [
  { id: 'signes',    icon: '🧾', title: "Signes annonciateurs d’une crise" },
  { id: 'actions',   icon: '🧩', title: "Activités que je peux faire seul(e) pour traverser la crise" },
  { id: 'personnes', icon: '👥', title: "Personnes que je peux appeler ou chez qui je peux aller" },
  { id: 'soignants', icon: '🩺', title: "Soignants que je peux contacter ou services médicaux" },
];

const EMPTY: PlanData = {
  signes:    ['', '', '', '', ''],
  actions:   ['', '', '', '', ''],
  personnes: ['', '', '', '', ''],
  soignants: ['', '', '', '', ''],
};

export default function CrisisPlanPage() {
  const router = useRouter();

  /** thème doux */
  const [color, setColor] = useState('#A78BFA');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('themeColor');
      if (saved) setColor(saved);
    } catch {}
  }, []);
  const bg = useMemo(
    () => `radial-gradient(1200px 800px at 50% -10%, ${tint(color, 0.85)} 0%, #F6F7FE 55%)`,
    [color]
  );

  /** données du plan */
  const [plan, setPlan] = useState<PlanData>(EMPTY);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crisisPlan');
      if (saved) setPlan({ ...EMPTY, ...JSON.parse(saved) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('crisisPlan', JSON.stringify(plan));
    } catch {}
  }, [plan]);

  function updateCell(section: SectionId, idx: number, value: string) {
    setPlan(prev => {
      const next = { ...prev, [section]: [...prev[section]] };
      next[section][idx] = value;
      return next;
    });
  }

  function pressFeedback() {
    try { (navigator as any)?.vibrate?.(12); } catch {}
  }

  function resetSection(section: SectionId) {
    pressFeedback();
    setPlan(prev => ({ ...prev, [section]: ['', '', '', '', ''] }));
  }

  function goBack() {
    // Si on a une page précédente, on y revient, sinon on redirige vers la page d'aide
    if (typeof document !== 'undefined' && document.referrer) {
      router.back();
    } else {
      router.push('/emergency'); // ← ta page “J’ai besoin d’aide”
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: bg,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        color: '#0f172a',
      }}
    >
      <style>{css}</style>

      {/* top bar */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          padding: '16px 20px',
        }}
      >
        <button
          onClick={goBack}
          aria-label="Retour"
          style={{ textDecoration: 'none', color: '#111', fontSize: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Plan de crise/sécurité</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>Tu peux le compléter ou l’actualiser !</p>
        </div>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>⚙️</button>
      </header>

      {/* sections */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 20px', display: 'grid', gap: 16 }}>
        {SECTIONS.map(sec => (
          <article key={sec.id} style={card(color)} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={pillIcon}>{sec.icon}</span>
                {sec.title}
              </h2>
              <button onClick={() => resetSection(sec.id)} className="linkReset">Réinitialiser</button>
            </div>

            <ol style={{ listStyle: 'decimal', paddingLeft: 18, margin: '8px 0 0', display: 'grid', gap: 8 }}>
              {plan[sec.id].map((val, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={val}
                    onChange={(e) => updateCell(sec.id, i, e.target.value)}
                    onFocus={pressFeedback}
                    placeholder="…"
                    style={inputStyle}
                  />
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      {/* bas de page: actions simples */}
      <footer
        style={{
          maxWidth: 800,
          margin: '0 auto 18px',
          padding: '0 20px',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}
      >
        <a href="/sos" style={btnSecondary}>Voir numéros d’urgence</a>
      </footer>
    </main>
  );
}

/* — styles — */
const gearBtn: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

const pillIcon: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  background: 'rgba(0,0,0,.04)',
};

const card = (c: string): React.CSSProperties => ({
  border: '1px solid rgba(0,0,0,.06)',
  borderRadius: 18,
  background: `linear-gradient(180deg, ${c}22 0%, ${c}10 100%)`,
  boxShadow: '0 8px 18px rgba(0,0,0,.06)',
  padding: '14px 14px 16px',
});

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '10px 12px',
  background: '#fff',
  outline: 'none',
  fontSize: 14,
};

const btnSecondary: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
};

const css = `
  .card:active { transform: scale(.995) }
  .linkReset {
    border: none;
    background: transparent;
    color: #0f172a;
    opacity: .65;
    font-size: 13px;
    cursor: pointer;
  }
  .linkReset:hover { opacity: .9; text-decoration: underline }
`;
