'use client';

import type { CSSProperties, ReactNode } from 'react';
import HomeButton from './HomeButton';

export default function PageHeaderActions({
  children,
  style,
}: {
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...actionsStyle, ...style }}>
      <HomeButton />
      <button type="button" aria-label="Paramètres" title="Paramètres" style={buttonStyle}>⚙️</button>
      {children}
    </div>
  );
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  justifySelf: 'end',
};

const buttonStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  background: '#fff',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
  lineHeight: 1,
  minWidth: 40,
  minHeight: 40,
};
