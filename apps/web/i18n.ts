'use client';

export type Lang = 'fr' | 'en' | 'ar';

const DICT: Record<Lang, Record<string, string>> = {
  fr: {
    how: 'Comment te sens-tu ?',
    hyper: 'Hyperactivation',
    window: 'Fenêtre de tolérance',
    hypo: 'Hypoactivation',
    hyperCap: 'rythme élevé, agitation',
    windowCap: 'zone d’équilibre',
    hypoCap: 'ralentissement, fatigue',
    start: 'Commencer un exercice',
    help: 'J’ai besoin d’aide',
    theme: 'Couleur du thème',
    settings: 'Paramètres (bientôt)',
  },
  en: {
    how: 'How do you feel?',
    hyper: 'Hyperactivation',
    window: 'Window of tolerance',
    hypo: 'Hypoactivation',
    hyperCap: 'high arousal, agitation',
    windowCap: 'balanced zone',
    hypoCap: 'slowing down, fatigue',
    start: 'Start an exercise',
    help: 'I need help',
    theme: 'Theme color',
    settings: 'Settings (soon)',
  },
  ar: {
    how: 'كيف تشعر الآن؟',
    hyper: 'فرط التنشيط',
    window: 'نافذة التحمّل',
    hypo: 'انخفاض التنشيط',
    hyperCap: 'توتر عالٍ واضطراب',
    windowCap: 'منطقة التوازن',
    hypoCap: 'تباطؤ وإرهاق',
    start: 'ابدأ تمرينًا',
    help: 'أحتاج مساعدة',
    theme: 'لون السمة',
    settings: 'الإعدادات (قريبًا)',
  },
};

const RTL = new Set<Lang>(['ar']);

export function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'fr';
  const saved = window.localStorage.getItem('lang') as Lang | null;
  if (saved) return saved;
  const nav = (navigator.language || 'fr').slice(0, 2) as Lang;
  return (['fr', 'en', 'ar'] as Lang[]).includes(nav) ? nav : 'fr';
}

export function isRTL(lang: Lang) {
  return RTL.has(lang);
}

export function useI18n() {
  const lang = getInitialLang();
  return {
    t: (key: string) => (DICT[lang] && DICT[lang][key]) || key,
    lang,
  };
}

/** Reactive hook version (to switch live) */
import { useEffect, useState } from 'react';
export function useI18nState() {
  const [lang, setLang] = useState<Lang>(getInitialLang());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', isRTL(lang) ? 'rtl' : 'ltr');
    }
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key: string) => (DICT[lang] && DICT[lang][key]) || key;

  return { lang, setLang, t };
}
