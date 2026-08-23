'use client';

import { useEffect } from 'react';

export default function SettingsNavigationBridge() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button');
      if (!button || window.location.pathname === '/app') return;

      const isSettingsButton =
        button.getAttribute('aria-label') === 'Paramètres' ||
        button.getAttribute('title') === 'Paramètres' ||
        button.textContent?.trim() === '⚙️';

      if (!isSettingsButton) return;

      event.preventDefault();
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.assign(`/app?settings=open&returnTo=${encodeURIComponent(returnTo)}`);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
