'use client';

import { useEffect, useState } from 'react';

export const DEFAULT_THEME_COLOR = '#A78BFA';

function normalizeHex(hex: string) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  return clean.padEnd(6, '0');
}

function parseHex(hex: string) {
  const value = normalizeHex(hex);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

export function tintColor(hex: string, intensity: number) {
  const { r, g, b } = parseHex(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * intensity);
  return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function getStoredThemeColor() {
  if (typeof window === 'undefined') return DEFAULT_THEME_COLOR;
  return window.localStorage.getItem('themeColor') ?? DEFAULT_THEME_COLOR;
}

export function setThemeColor(color: string) {
  if (typeof window === 'undefined') return;
  const normalized = `#${normalizeHex(color)}`;
  window.localStorage.setItem('themeColor', normalized);
  const { r, g, b } = parseHex(normalized);
  document.documentElement.style.setProperty('--theme-color', normalized);
  document.documentElement.style.setProperty('--theme-color-rgb', `${r}, ${g}, ${b}`);
  window.dispatchEvent(new CustomEvent('theme-color-change', { detail: normalized }));
}

export function useThemeColor() {
  const [color, setColor] = useState(DEFAULT_THEME_COLOR);
  useEffect(() => {
    setColor(getStoredThemeColor());
    const handler = (event: Event) => {
      setColor((event as CustomEvent<string>).detail ?? DEFAULT_THEME_COLOR);
    };
    window.addEventListener('theme-color-change', handler);
    return () => window.removeEventListener('theme-color-change', handler);
  }, []);
  return color;
}

export function ThemeColorSync() {
  useEffect(() => {
    const initial = getStoredThemeColor();
    const { r, g, b } = parseHex(initial);
    document.documentElement.style.setProperty('--theme-color', initial);
    document.documentElement.style.setProperty('--theme-color-rgb', `${r}, ${g}, ${b}`);
    const handler = (event: Event) => {
      const next = (event as CustomEvent<string>).detail ?? DEFAULT_THEME_COLOR;
      const parsed = parseHex(next);
      document.documentElement.style.setProperty('--theme-color', next);
      document.documentElement.style.setProperty('--theme-color-rgb', `${parsed.r}, ${parsed.g}, ${parsed.b}`);
    };
    window.addEventListener('theme-color-change', handler);
    return () => window.removeEventListener('theme-color-change', handler);
  }, []);
  return null;
}

export function gradientBackground(color: string, topAlpha = 0.12, bottomAlpha = 0.05) {
  return `linear-gradient(180deg, ${withAlpha(color, topAlpha)} 0%, ${withAlpha(color, bottomAlpha)} 100%)`;
}

export function radialBackground(color: string, intensity = 0.85) {
  return `radial-gradient(1200px 800px at 50% -10%, ${tintColor(color, intensity)} 0%, #F6F7FE 55%)`;
}

export function ThemeBootstrapScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var c=localStorage.getItem('themeColor');if(!c)return;c=c.replace(/#/g,'');if(c.length===3){c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];}c=(c+'000000').slice(0,6);var full='#'+c;var r=parseInt(c.slice(0,2),16);var g=parseInt(c.slice(2,4),16);var b=parseInt(c.slice(4,6),16);document.documentElement.style.setProperty('--theme-color',full);document.documentElement.style.setProperty('--theme-color-rgb',r+','+g+','+b);window.__THEME_COLOR__=full;}catch(e){}})();`
      }}
    />
  );
}
