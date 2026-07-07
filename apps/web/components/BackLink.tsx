'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import type {
  CSSProperties,
  TouchEventHandler,
  MouseEvent,
  TouchEvent,
  MouseEventHandler
} from 'react';

type Props = {
  href?: string | null;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  onMouseDown?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  label?: string;
  style?: CSSProperties;
  className?: string;
};

const baseStyle: CSSProperties = {
  textDecoration: 'none',
  color: '#111',
  fontSize: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 999,
};

export default function BackLink({
  href,
  onClick,
  onMouseDown,
  onTouchStart,
  label = 'Retour',
  style,
  className
}: Props) {
  const router = useRouter();

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (onClick) return;

    const fallback = (href ?? '/') as Route;

    if (href == null && window.history.length > 1) {
      event.preventDefault();
      router.back();
      return;
    }

    if (fallback) {
      event.preventDefault();
      router.push(fallback);
    }
  };

  const handleAnchorClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const fallback = (href ?? '/') as Route;
    if (!fallback) return;

    event.preventDefault();
    router.push(fallback);
  };

  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        onClick={handleAnchorClick}
        onMouseDown={onMouseDown as MouseEventHandler<HTMLAnchorElement> | undefined}
        onTouchStart={onTouchStart as TouchEventHandler<HTMLAnchorElement> | undefined}
        className={className}
        style={{ ...baseStyle, ...style, cursor: 'pointer' }}
      >
        ←
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleButtonClick}
      onMouseDown={onMouseDown as MouseEventHandler<HTMLButtonElement> | undefined}
      onTouchStart={onTouchStart as TouchEventHandler<HTMLButtonElement> | undefined}
      className={className}
      style={{ ...baseStyle, ...style, border: 'none', background: 'transparent', cursor: 'pointer' }}
    >
      ←
    </button>
  );
}
