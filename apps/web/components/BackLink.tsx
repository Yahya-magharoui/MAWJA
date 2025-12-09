'use client';

import Link from 'next/link';
import type {
  CSSProperties,
  MouseEventHandler,
  TouchEventHandler,
  MouseEvent,
  TouchEvent
} from 'react';

type Props = {
  href?: string; // ← FIX ICI
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
  href = '/',
  onClick,
  onMouseDown,
  onTouchStart,
  label = 'Retour',
  style,
  className
}: Props) {
  if (href) {
    return (
      <Link
        href={{ pathname: href }}
        aria-label={label}
        className={className}
        style={{ ...baseStyle, ...style }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        ←
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseDown={onMouseDown as MouseEventHandler<HTMLButtonElement> | undefined}
      onTouchStart={onTouchStart as TouchEventHandler<HTMLButtonElement> | undefined}
      className={className}
      style={{ ...baseStyle, ...style, border: 'none', background: 'transparent', cursor: 'pointer' }}
    >
      ←
    </button>
  );
}
