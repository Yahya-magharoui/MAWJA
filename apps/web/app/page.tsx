'use client';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryParam } from '../hooks/useQueryParam';
import { persistGuestSession } from '../lib/session';

const sourGummy = localFont({
  src: './fonts/SourGummy-variable.ttf',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  weight: '100 900',
});

/* —— slides —— */
type Slide = {
  id: string;
  img: string;        // chemin public/...
  alt: string;
  title?: string;     // petit titre courbé
  lines: string[];    // paragraphes (automatique en <p>)
};

const SLIDES: Slide[] = [
  {
    id: 'window',
    img: '/intro/tolerance_ouverte.png',
    alt: 'Fenêtre ouverte avec vague',
    title: 'À PROPOS DE KALYMAP',
    lines: [
      "La fenêtre de tolérance, c’est une zone où tu te sens suffisamment stable pour gérer tes émotions et les stimulations extérieures.",
      "Quand tu t’y trouves, tu es dans un état d’équilibre, calme et attentif au monde qui t’entoure.",
    ],
  },
  {
    id: 'hyper',
    img: '/intro/hyper.png',
    alt: 'Fenêtre avec flèche vers le haut',
    title: 'À PROPOS DE KALYMAP',
    lines: [
      "Quand tu dépasses ta fenêtre de tolérance vers l’hyperactivation ton corps réagit comme s’il y avait un danger imminent.",
      "C’est une réponse automatique de protection (lutte ou fuite).",
      "Tu peux ressentir : rythme cardiaque rapide, irritabilité, respiration rapide, tensions, sueurs, palpitations, anxiété, agitation, hypervigilance.",
    ],
  },
  {
    id: 'hypo',
    img: '/intro/hypo.png',
    alt: 'Fenêtre avec flèche vers le bas',
    title: 'À PROPOS DE KALYMAP',
    lines: [
      "Quand tu dépasses ta fenêtre de tolérance vers l’hypoactivation le système passe en mode « paralysie / dissociation » pour te protéger d’une surcharge émotionnelle.",
      "Tu peux ressentir : paralysie, déconnexion, engourdissement, digestion perturbée, respiration impactée, déréalisation, apathie, retrait, confusion.",
    ],
  },
  {
    id: 'why',
    img: '/intro/chemins.png',
    alt: 'Transition entre fenêtres',
    title: 'À PROPOS DE KALYMAP',
    lines: [
      "Connaître ta fenêtre de tolérance t’aide à repérer l’hypoactivation et l’hyperactivation.",
      "Quand tu identifies l’état dans lequel tu te trouves, tu peux utiliser des stratégies pour revenir dans ta fenêtre de tolérance et éviter de rester trop longtemps en déséquilibre.",
    ],
  },
];

function ArcTitle({ text }: { text: string }) {
  if (!text) return <div style={styles.titleArch} />;
  const chars = text.split('');
  const mid = (chars.length - 1) / 2;
  const curve = 8; // degree spacing

  return (
    <div className={sourGummy.className} style={styles.titleArch} aria-hidden>
      {chars.map((char, idx) => (
        <span key={`${char}-${idx}`} style={{ padding:'0 1px' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const nameParam = useQueryParam('name', '');
  const name = nameParam ?? '';

  /* état du carrousel */
  const [i, setI] = useState(0);
  const last = SLIDES.length - 1;

  /* swipe */
  const startX = useRef<number | null>(null);

  const vibe = useCallback((ms = 10) => {
    try { (navigator as any)?.vibrate?.(ms); } catch {}
  }, []);

  const prev = useCallback(() => {
    if (i > 0) {
      vibe();
      setI(i - 1);
    }
  }, [i, vibe]);

  const next = useCallback(() => {
    if (i < last) {
      vibe();
      setI(i + 1);
    }
  }, [i, last, vibe]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, router]);

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const sx = startX.current; startX.current = null;
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 30) return;
    if (dx < 0) next(); else prev();
  }

  /* CTA */
  function rememberSeen() { localStorage.setItem('onboardingSeen', 'true'); }
  async function startGuest() {
    rememberSeen();
    const existing = localStorage.getItem('guestId');
    const guestId = existing ?? crypto.randomUUID();
    localStorage.setItem('guestId', guestId);
    persistGuestSession({ id: guestId, role: 'PATIENT' });
    router.push('/app');
  }

  const slide = SLIDES[i];

  return (
    <main className="landing-page-shell" style={styles.page}>
      <style>{css}</style>
      <section className="landing-seo-intro" style={styles.seoIntro}>
        <h1 style={styles.seoH1}>Kalymap, une application dédiée à la régulation émotionnelle</h1>
        <p style={styles.seoLead}>
          Fondée sur le concept de la fenêtre de tolérance, Kalymap aide à mieux identifier son état émotionnel et propose des exercices adaptés aux besoins du moment.
        </p>
      </section>
      <header style={styles.langRow}>
        <div />
        <div style={styles.langs}>
          <a href="#" onClick={(e)=>e.preventDefault()} style={styles.langActive}>FR</a>
          <span style={{opacity:.35}}> / </span>
          <a href="#" onClick={(e)=>e.preventDefault()} style={styles.lang}>EN</a>
        </div>
        <button
          onClick={() => { rememberSeen(); router.push('/app'); }}
          style={styles.skip}
          aria-label="Passer l’introduction"
        >
          Passer
        </button>
      </header>

      {/* Carrousel */}
      <section
        style={styles.carousel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ArcTitle text={slide.title ?? ''} />

        <div style={styles.illustr}>
          {/* Remplace les chemins par tes images /public/intro/... */}
          <Image src={slide.img} alt={slide.alt} fill sizes="(max-width: 520px) 90vw, 520px" style={{objectFit:'contain'}} />
        </div>

        <div className={sourGummy.className} style={styles.textBlock}>
          {slide.lines.map((t, k) => (
            <p key={k} style={styles.p}>{t}</p>
          ))}
          {name ? <p style={{...styles.p, marginTop:4}}>Bonjour {name} 👋</p> : null}
        </div>

        {/* pagination + nav */}
        <div style={styles.navRow}>
          <button onClick={prev} disabled={i===0} style={styles.navBtn} aria-label="Précédent">◀</button>
          <div style={styles.dots}>
            {SLIDES.map((s, k) => (
              <span key={s.id} style={{ ...styles.dot, opacity: k===i ? 1 : .3 }} />
            ))}
          </div>
          <button onClick={next} disabled={i===last} style={styles.navBtn} aria-label="Suivant">▶</button>
        </div>
      </section>

      {/* CTAs */}
      <section style={styles.ctas}>
        <a href="/signup" style={styles.btnPrimary}>Créer un compte</a>
        <a href="/login"  style={{ ...styles.btnPrimary, background:'#fff' }}>Se connecter</a>
        <button onClick={startGuest} style={styles.btnGhost}>Commencer sans compte</button>
      </section>

      <section className="landing-seo-content" style={styles.seoContent} aria-labelledby="how-kalymap-works">
        <div style={styles.seoCard}>
          <h2 id="how-kalymap-works" style={styles.seoH2}>Comment fonctionne Kalymap ?</h2>
          <ol style={styles.seoList}>
            <li>Repérer l’état du moment</li>
            <li>Identifier son niveau d’activation</li>
            <li>Accéder à des exercices adaptés</li>
            <li>Réévaluer son état après l’exercice</li>
          </ol>
        </div>

        <div style={styles.seoCard}>
          <h2 style={styles.seoH2}>Un soutien complémentaire au quotidien</h2>
          <p style={styles.seoParagraph}>
            Kalymap a été pensée comme un outil complémentaire au suivi en santé mentale. Elle facilite l’utilisation quotidienne des outils proposés en séance et favorise leur appropriation, sans jamais se substituer à un accompagnement professionnel.
          </p>
          <p style={styles.seoParagraph}>
            Selon le niveau d’hyperactivation ou d’hypoactivation identifié, l’application donne accès à des exercices de régulation émotionnelle comme l’ancrage, la respiration et la pleine conscience.
          </p>
        </div>

        <div style={styles.seoCard}>
          <h2 style={styles.seoH2}>À quoi sert Kalymap ?</h2>
          <ul style={styles.seoList}>
            <li>Soutenir la régulation émotionnelle grâce à des exercices adaptés à l’état du moment.</li>
            <li>Favoriser l’engagement dans les exercices proposés en séance et leur mise en pratique.</li>
            <li>Faciliter leur utilisation au quotidien grâce à un support numérique simple et accessible.</li>
            <li>Compléter le suivi professionnel sans jamais s’y substituer.</li>
          </ul>
        </div>
      </section>

      <footer className="landing-footer" style={styles.footer}>
        <a href="/sos" style={styles.footerLink}>Numéros d’urgence</a>
        <span style={{opacity:.4}}> • </span>
        <a href="/privacy" style={styles.footerLink}>Confidentialité</a>
        <span style={{opacity:.4}}> • </span>
        <a href="/terms" style={styles.footerLink}>CGU</a>
      </footer>
    </main>
  );
}

/* —— styles —— */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight:'100dvh',
    display:'grid',
    gridTemplateRows:'auto auto 1fr auto auto auto',
    gap:10,
    background:'#F6F7FE',
    color:'#0f172a',
  },
  seoIntro: {
    maxWidth: 760,
    width: '100%',
    justifySelf: 'center',
    padding: '20px 20px 0',
    textAlign: 'center',
  },
  seoH1: { margin: 0, fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.15 },
  seoLead: { margin: '12px auto 0', maxWidth: 680, lineHeight: 1.6, color: '#334155' },
  langRow: {
    display:'grid',
    gridTemplateColumns:'1fr auto 1fr',
    alignItems:'center',
    padding:'10px 16px 0',
  },
  langs: { justifySelf:'center', fontSize:12 },
  lang: { color:'#111', textDecoration:'none', opacity:.5 },
  langActive: { color:'#111', textDecoration:'none', fontWeight:700 },
  skip: {
    justifySelf:'end',
    border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'6px 10px',
    cursor:'pointer', fontSize:12,
  },

  carousel: {
    maxWidth:520, width:'100%', justifySelf:'center',
    display:'grid', gridTemplateRows:'auto 260px 1fr auto', gap:8, padding:'0 16px',
  },
  titleArch: {
    display:'flex',
    justifyContent:'center',
    alignItems:'flex-end',
    height:40,
    fontWeight:900,
    letterSpacing:.6,
    fontSize:13,
    opacity:.85,
    marginTop:6,
    gap:0,
    lineHeight:1,
  },
  illustr: {
    position:'relative', width:'100%', height:260, borderRadius:24,
    overflow:'hidden',
  },
  textBlock: { marginTop:4 },
  p: { margin:'6px 0 0', lineHeight:1.45, fontSize:14, textAlign:'center' },

  navRow: { display:'grid', gridTemplateColumns:'40px 1fr 40px', alignItems:'center', marginTop:8 },
  navBtn: {
    border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:'8px 0',
    cursor:'pointer', fontWeight:700,
  },
  dots: { display:'flex', gap:6, justifyContent:'center', alignItems:'center' },
  dot: { width:8, height:8, background:'#6d28d9', borderRadius:'50%' },

  ctas: {
    display:'grid', gap:10, maxWidth:520, width:'100%', justifySelf:'center', padding:'0 16px',
  },
  btnPrimary: {
    display:'block', textAlign:'center', padding:'12px 16px', borderRadius:12,
    border:'1px solid #ddd', background:'#fafafa', color:'#111', textDecoration:'none', fontWeight:700,
    boxShadow:'0 8px 18px rgba(0,0,0,.06)',
  },
  btnGhost: {
    padding:'12px 16px', borderRadius:12, border:'1px solid rgba(0,0,0,.1)', background:'#fff',
    cursor:'pointer', fontWeight:700, boxShadow:'0 6px 14px rgba(0,0,0,.05)'
  },
  seoContent: {
    display: 'grid',
    gap: 16,
    maxWidth: 900,
    width: '100%',
    justifySelf: 'center',
    padding: '30px 20px 12px',
  },
  seoCard: {
    background: 'rgba(255,255,255,.72)',
    border: '1px solid #e9e5f5',
    borderRadius: 20,
    padding: '22px clamp(18px, 4vw, 30px)',
    boxShadow: '0 10px 28px rgba(76,29,149,.05)',
  },
  seoH2: { margin: '0 0 10px', fontSize: 21, lineHeight: 1.3 },
  seoParagraph: { margin: '8px 0 0', lineHeight: 1.65, color: '#334155' },
  seoList: { margin: 0, paddingLeft: 22, display: 'grid', gap: 8, lineHeight: 1.55, color: '#334155' },

  footer: {
    justifySelf:'center', display:'flex', gap:10, margin:'6px 0 18px', fontSize:12,
  },
  footerLink: {
    color:'#4f46e5',
    textDecoration:'underline'
  }
};

const css = `
  @media (max-width: 760px) {
    .landing-footer {
      flex-wrap: wrap;
      justify-content: center;
      text-align: center;
      padding: 0 12px;
      row-gap: 6px;
    }
  }

  @media (max-width: 520px) {
    .landing-page-shell {
      overflow-x: clip;
    }

    .landing-seo-intro {
      padding-top: 14px !important;
    }

    .landing-seo-content {
      padding-top: 22px !important;
    }
  }
`;
