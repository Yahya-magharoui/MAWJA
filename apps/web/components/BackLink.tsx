'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import type {
  CSSProperties,
  MouseEventHandler,
  TouchEventHandler,
  MouseEvent,
  TouchEvent
} from 'react';

type Props = {
  href?: string | null;
  onClick?: MouseEventHandler<HTMLButtonElement>;
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

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (onClick) return;

    const fallback = (href ?? '/') as Route;

    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
      return;
    }

    if (fallback) {
      event.preventDefault();
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      onMouseDown={onMouseDown as MouseEventHandler<HTMLButtonElement> | undefined}
      onTouchStart={onTouchStart as TouchEventHandler<HTMLButtonElement> | undefined}
      className={className}
      style={{ ...baseStyle, ...style, border: 'none', background: 'transparent', cursor: 'pointer' }}
    >
      ←
    </button>
  );
}
