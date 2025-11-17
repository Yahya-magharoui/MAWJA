'use client';
import { Lang, useI18nState } from '../../web/i18n';

export default function LanguageSwitcher(
  { className }: { className?: string }
) {
  const { lang, setLang } = useI18nState();
  const btn = (code: Lang, label: string) => (
    <button
      key={code}
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      style={{
        padding: '6px 10px',
        borderRadius: 10,
        border: lang === code ? '1px solid #111' : '1px solid #ddd',
        background: lang === code ? '#fff' : '#f5f5f5',
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={className} style={{ display: 'flex', gap: 8 }}>
      {btn('fr','FR')}
      {btn('en','EN')}
      {btn('ar','العربية')}
    </div>
  );
}
