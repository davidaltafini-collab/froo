import React from 'react';
import type { VisibleSnapGuide } from './snap-engine';

const COLORS: Record<VisibleSnapGuide['kind'], { line: string; badge: string; text: string }> = {
  guide: { line: '#0ea5e9', badge: '#e0f2fe', text: '#0369a1' },
  edge: { line: '#d946ef', badge: '#fae8ff', text: '#a21caf' },
  center: { line: '#d946ef', badge: '#fae8ff', text: '#a21caf' },
  'equal-gap': { line: '#8b5cf6', badge: '#ede9fe', text: '#6d28d9' },
  padding: { line: '#f59e0b', badge: '#fef3c7', text: '#b45309' },
};

function SnapGuideLine({ guide }: { guide: VisibleSnapGuide }) {
  const colors = COLORS[guide.kind];
  const isX = guide.axis === 'x';
  const start = Math.min(guide.start, guide.end);
  const length = Math.max(1, Math.abs(guide.end - guide.start));
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: isX ? guide.position : start,
          top: isX ? start : guide.position,
          width: isX ? 1 : length,
          height: isX ? length : 1,
          background: colors.line,
          boxShadow: `0 0 0 1px ${colors.line}22`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: isX ? guide.position + 7 : start + length / 2,
          top: isX ? start + length / 2 : guide.position + 7,
          transform: isX ? 'translateY(-50%)' : 'translateX(-50%)',
          borderRadius: 5,
          border: `1px solid ${colors.line}33`,
          background: colors.badge,
          color: colors.text,
          padding: '2px 5px',
          fontSize: 10,
          fontWeight: 750,
          lineHeight: '14px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
          pointerEvents: 'none',
        }}
      >
        {guide.label}
      </div>
    </>
  );
}

export function SnapGuides({ guides }: { guides: VisibleSnapGuide[] }) {
  if (!guides.length) return null;
  return <>{guides.map((guide) => <SnapGuideLine key={guide.key} guide={guide} />)}</>;
}

