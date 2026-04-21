'use client';
import { useState } from 'react';
import BackLink from '../../../components/BackLink';
import { useQueryParam } from '../../../hooks/useQueryParam';

type KitSection = {
  key: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

const SECTIONS: KitSection[] = [
  {
    key: 'touch',
    title: 'Toucher',
    subtitle: 'Objets rassurants à tenir ou à serrer',
    bullets: ['ex: balle sensorielle', 'ex: tissu doux', 'ex: objet anti-stress'],
  },
  {
    key: 'visuel',
    title: 'Visuel',
    subtitle: 'Ce qui apaise ton regard',
    bullets: ['ex: photo réconfortante', 'ex: citation ou dessin'],
  },
  {
    key: 'odeur',
    title: 'Odeur',
    subtitle: 'Parfums ou huiles qui te calment',
    bullets: ['ex: huile essentielle', 'ex: mouchoir parfumé'],
  },
  {
    key: 'gout',
    title: 'Goût',
    subtitle: 'Saveurs douces et réconfortantes',
    bullets: ['ex: bonbon / gomme', 'ex: fruits secs'],
  },
  {
    key: 'son',
    title: 'Son / Audition',
    subtitle: 'Tout ce qui détend ton écoute',
    bullets: ['ex: playlist apaisante', 'ex: bouchons d’oreilles'],
  },
];

function useOrigin() {
  const fromParam = useQueryParam('from', 'hyper');
  switch (fromParam) {
    case 'hypo':
      return '/hypoactivation';
    case 'app':
      return '/app';
    default:
      return '/hyperactivation';
  }
}

export default function SafetyKitPage() {
  const backHref = useOrigin();
  const [draft, setDraft] = useState('');
  const [customItems, setCustomItems] = useState<string[]>([]);

  const addCustomItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setCustomItems(prev => [...prev, trimmed]);
    setDraft('');
  };

  return (
    <main style={page}>
      <style>{css}</style>

      <header style={header}>
        <BackLink href={backHref} style={{ justifySelf: 'start' }} />
        <h1 style={{ margin: 0, fontSize: 20 }}>Trousse de sécurité</h1>
        <button aria-label="Paramètres" title="Paramètres" style={gearBtn}>
          ⚙️
        </button>
      </header>

      <section style={intro}>
        <p>
          Prends un contenant pour ta trousse émotionnelle et remplis-le d’objets qui te font du bien.
          Essaie d’ajouter une idée dans chaque catégorie ci-dessous. Tu pourras remplacer ces exemples
          par tes propres objets quand tu seras prêt·e.
        </p>
        <p style={{ opacity: 0.7 }}>
          Le plus important est que ta trousse soit facile à attraper et fonctionne pour toi, où que tu sois.
        </p>
      </section>

      <section style={grid}>
        {SECTIONS.map((section) => (
          <article key={section.key} style={card}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{section.title}</h2>
            <p style={{ margin: '4px 0 10px', opacity: 0.75, fontSize: 13 }}>{section.subtitle}</p>
            <ul style={list}>
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ padding: '0 20px', maxWidth: 960, margin: '0 auto 60px' }}>
        <article style={customCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={addCustomItem} style={addBtn} aria-label="Ajouter un élément">
              +
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Ma trousse personnelle</p>
              <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>Écris ce que tu veux mettre dans ta trousse.</p>
            </div>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ajoute ici tes idées (ex : balle sensorielle, huile de lavande, photo...)"
            style={textarea}
            rows={3}
          />

          {!!customItems.length && (
            <div style={chipRow}>
              {customItems.map((item, idx) => (
                <span key={`${item}-${idx}`} style={chip}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#F6F7FE',
  fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  color: '#0f172a',
  paddingBottom: 40,
};

const header: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  padding: '16px 20px',
};

const gearBtn: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

const intro: React.CSSProperties = {
  margin: '0 auto 16px',
  padding: '0 20px',
  maxWidth: 640,
  lineHeight: 1.45,
};

const grid: React.CSSProperties = {
  display: 'grid',
  gap: 18,
  padding: '0 20px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  maxWidth: 960,
  margin: '0 auto 40px',
};

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 22,
  padding: '20px 22px',
  boxShadow: '0 10px 26px rgba(15,23,42,.08)',
  border: '1px solid rgba(15,23,42,.05)',
};

const list: React.CSSProperties = {
  paddingLeft: 18,
  margin: 0,
  lineHeight: 1.45,
  color: '#0f172a',
  fontSize: 14,
};

const css = `
  article ul li + li { margin-top: 6px; }
`;

const customCard: React.CSSProperties = {
  borderRadius: 22,
  padding: '18px 20px 20px',
  border: '1px dashed rgba(15,23,42,.25)',
  background: 'rgba(167,139,250,0.08)',
  boxShadow: '0 12px 30px rgba(15,23,42,.06)',
};

const addBtn: React.CSSProperties = {
  borderRadius: 12,
  width: 40,
  height: 40,
  border: '1px solid rgba(15,23,42,.15)',
  background: '#fff',
  fontSize: 20,
  cursor: 'pointer',
};

const textarea: React.CSSProperties = {
  width: '100%',
  borderRadius: 16,
  border: '1px solid rgba(15,23,42,.12)',
  padding: '12px 14px',
  fontSize: 14,
  resize: 'vertical',
  outline: 'none',
  minHeight: 80,
  background: '#fff',
};

const chipRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};

const chip: React.CSSProperties = {
  borderRadius: 20,
  padding: '6px 12px',
  background: '#fff',
  border: '1px solid rgba(15,23,42,.12)',
  fontSize: 13,
};
