'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'kalymap-splash-seen';
const MIN_SPLASH_DURATION = 1800;
const MAX_SPLASH_DURATION = 5000;
const EXIT_DURATION = 400;

type SplashPhase = 'visible' | 'exiting' | 'hidden';

function lockScroll() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function markSplashSeen() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {}
}

function hasSeenSplash() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return document.documentElement.dataset.mawjaSplashSeen === 'true';
  }
}

export function SplashBootstrapScript({ nonce }: { nonce?: string }) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var seen=sessionStorage.getItem('${SESSION_KEY}')==='true';document.documentElement.dataset.mawjaSplashSeen=seen?'true':'false';}catch(e){document.documentElement.dataset.mawjaSplashSeen='false';}})();`,
      }}
    />
  );
}

export default function AppSplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('visible');
  const [entered, setEntered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [minimumReached, setMinimumReached] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (hasSeenSplash()) {
      setPhase('hidden');
      unlockScroll();
      return;
    }

    lockScroll();

    const enterFrame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    const minimumTimer = window.setTimeout(() => {
      setMinimumReached(true);
    }, MIN_SPLASH_DURATION);

    const maxTimer = window.setTimeout(() => {
      setPhase((current) => (current === 'hidden' ? current : 'exiting'));
    }, MAX_SPLASH_DURATION);

    const flagReady = () => {
      window.requestAnimationFrame(() => {
        setAppReady(true);
      });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      flagReady();
    } else {
      document.addEventListener('DOMContentLoaded', flagReady, { once: true });
      window.addEventListener('load', flagReady, { once: true });
    }

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maxTimer);
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
      document.removeEventListener('DOMContentLoaded', flagReady);
      window.removeEventListener('load', flagReady);
      unlockScroll();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'visible') return;
    if (!minimumReached || !appReady || !imageLoaded) return;

    setPhase('exiting');
  }, [appReady, imageLoaded, minimumReached, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;

    exitTimerRef.current = window.setTimeout(() => {
      markSplashSeen();
      setPhase('hidden');
      unlockScroll();
    }, EXIT_DURATION);

    return () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'hidden') {
      unlockScroll();
    }
  }, [phase]);

  if (phase === 'hidden') {
    return null;
  }

  const isVisible = phase === 'visible';
  const canBreathe = entered && isVisible && imageLoaded;

  return (
    <>
      <div
        className={`mawja-splash-root ${entered ? 'is-entered' : ''} ${phase === 'exiting' ? 'is-exiting' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Chargement de Kalymap"
        aria-hidden={!isVisible}
      >
        <div className="mawja-splash-orb mawja-splash-orb-left" />
        <div className="mawja-splash-orb mawja-splash-orb-right" />

        <div className="mawja-splash-content">
          <div className={`mawja-splash-logo-shell ${canBreathe ? 'is-breathing' : ''}`}>
            <div className="mawja-splash-halo" />
            <Image
              src="/brand/kalymap-splash-hero.png"
              alt="Mascotte Kalymap"
              width={360}
              height={360}
              priority
              className="mawja-splash-logo"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <p className="mawja-splash-title">Bienvenue chez Kalymap</p>

          <div className="mawja-splash-status" aria-hidden="true">
            <span className="mawja-splash-dot" />
            <span className="mawja-splash-dot" />
            <span className="mawja-splash-dot" />
          </div>
        </div>
      </div>

      <style>{css}</style>
    </>
  );
}

const css = `
  .mawja-splash-root {
    position: fixed;
    inset: 0;
    z-index: 99999;
    min-height: 100dvh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding:
      max(24px, env(safe-area-inset-top))
      max(20px, env(safe-area-inset-right))
      max(24px, env(safe-area-inset-bottom))
      max(20px, env(safe-area-inset-left));
    background:
      radial-gradient(1200px 800px at 50% -10%, rgba(255,255,255,0.68) 0%, transparent 60%),
      linear-gradient(180deg, #f8eff1 0%, #f8eff1 55%, #f7eef6 100%);
    opacity: 1;
    transform: scale(1);
    transition:
      opacity 400ms ease,
      transform 400ms ease;
    overflow: clip;
    pointer-events: auto;
  }

  .mawja-splash-root.is-exiting {
    opacity: 0;
    transform: scale(1.03);
  }

  .mawja-splash-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(18px, 4vh, 30px);
    width: 100%;
    min-height: 100%;
    padding: 24px;
    text-align: center;
    isolation: isolate;
    transition: transform 400ms ease;
  }

  .mawja-splash-root.is-exiting .mawja-splash-content {
    transform: scale(1.025);
  }

  .mawja-splash-logo-shell {
    position: relative;
    width: clamp(190px, 52vw, 360px);
    max-height: 52dvh;
    transform: translateY(16px) scale(0.9);
    opacity: 0;
    transition:
      transform 600ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }

  .mawja-splash-root.is-entered .mawja-splash-logo-shell {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  .mawja-splash-logo-shell.is-breathing {
    animation: mawja-splash-breathe 1.8s ease-in-out infinite;
  }

  .mawja-splash-logo {
    width: 100%;
    height: auto;
    max-height: 52dvh;
    object-fit: contain;
    display: block;
  }

  .mawja-splash-halo {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 106%;
    height: 106%;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background:
      radial-gradient(circle at center, rgba(167, 139, 250, 0.12) 0%, rgba(167, 139, 250, 0.05) 46%, rgba(167, 139, 250, 0) 74%);
    filter: blur(18px);
    z-index: -1;
  }

  .mawja-splash-title {
    margin: 0;
    padding: 0 12px;
    color: #2f2350;
    font-size: clamp(26px, 6vw, 42px);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 550ms cubic-bezier(0.22, 1, 0.36, 1) 200ms,
      transform 550ms cubic-bezier(0.22, 1, 0.36, 1) 200ms;
  }

  .mawja-splash-root.is-entered .mawja-splash-title {
    opacity: 1;
    transform: translateY(0);
  }

  .mawja-splash-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 12px;
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 380ms ease 300ms,
      transform 380ms ease 300ms;
  }

  .mawja-splash-root.is-entered .mawja-splash-status {
    opacity: 1;
    transform: translateY(0);
  }

  .mawja-splash-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(95, 73, 145, 0.42);
    animation: mawja-splash-dot 1.2s ease-in-out infinite;
  }

  .mawja-splash-dot:nth-child(2) {
    animation-delay: 0.14s;
  }

  .mawja-splash-dot:nth-child(3) {
    animation-delay: 0.28s;
  }

  .mawja-splash-orb {
    position: absolute;
    width: clamp(120px, 22vw, 260px);
    aspect-ratio: 1;
    border-radius: 999px;
    background: radial-gradient(circle at center, rgba(196, 181, 253, 0.18) 0%, rgba(196, 181, 253, 0) 72%);
    filter: blur(8px);
    pointer-events: none;
  }

  .mawja-splash-orb-left {
    top: 12%;
    left: 10%;
  }

  .mawja-splash-orb-right {
    right: 8%;
    bottom: 14%;
  }

  @keyframes mawja-splash-breathe {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(0) scale(1.025); }
  }

  @keyframes mawja-splash-dot {
    0%, 80%, 100% { opacity: 0.38; transform: scale(0.95); }
    40% { opacity: 0.82; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mawja-splash-root,
    .mawja-splash-logo-shell,
    .mawja-splash-title,
    .mawja-splash-status,
    .mawja-splash-content {
      transition-duration: 180ms;
    }

    .mawja-splash-logo-shell.is-breathing,
    .mawja-splash-dot {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .mawja-splash-logo-shell {
      width: clamp(190px, 68vw, 320px);
    }
  }

  @media (orientation: landscape) and (max-height: 560px) {
    .mawja-splash-logo-shell {
      width: min(34vw, 260px);
      max-height: 44dvh;
    }

    .mawja-splash-logo {
      max-height: 44dvh;
    }

    .mawja-splash-title {
      font-size: clamp(22px, 4vw, 32px);
    }
  }
`;
