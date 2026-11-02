import React from 'react';
import type { ReorderInsertion } from './reorder-engine';

export function InsertionIndicator({ insertion }: { insertion: ReorderInsertion | null }) {
  if (!insertion) return null;
  const { indicator } = insertion;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: indicator.left,
          top: indicator.top,
          width: indicator.width,
          height: indicator.height,
          borderRadius: 999,
          background: '#16a34a',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.92), 0 4px 14px rgba(22,163,74,0.28)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: indicator.axis === 'x' ? indicator.left + 7 : indicator.left + indicator.width / 2,
          top: indicator.axis === 'x' ? indicator.top + 6 : indicator.top - 7,
          transform: indicator.axis === 'x' ? 'none' : 'translate(-50%, -100%)',
          borderRadius: 6,
          background: '#052e16',
          color: '#f0fdf4',
          padding: '3px 6px',
          fontSize: 10,
          fontWeight: 750,
          lineHeight: '14px',
          whiteSpace: 'nowrap',
          boxShadow: '0 5px 14px rgba(5,46,22,0.22)',
          pointerEvents: 'none',
        }}
      >
        {insertion.label}
      </div>
    </>
  );
}

