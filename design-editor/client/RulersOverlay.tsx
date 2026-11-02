import React from 'react';
import { addRulerGuide, removeRulerGuide, updateRulerGuide, useDesignModeStore } from './store';

const Z = 2147482999;
const RULER_SIZE = 24;
const MAJOR = 100;
const MINOR = 10;

function ticks(length: number) {
  const out: number[] = [];
  for (let i = 0; i <= length; i += MINOR) out.push(i);
  return out;
}

function beginGuideDrag(axis: 'x' | 'y', start: number) {
  const id = addRulerGuide(axis, start);
  const onMove = (ev: PointerEvent) => {
    updateRulerGuide(id, axis === 'x' ? ev.clientX : ev.clientY);
  };
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    const next = axis === 'x' ? ev.clientX : ev.clientY;
    if (next < RULER_SIZE) removeRulerGuide(id);
    else updateRulerGuide(id, next);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

export function RulersOverlay() {
  const state = useDesignModeStore();
  const [, forceTick] = React.useState(0);

  React.useEffect(() => {
    if (!state.active || !state.rulers) return;
    const onResize = () => forceTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [state.active, state.rulers]);

  if (!state.active || !state.rulers) return null;

  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: Z, color: '#64748b', fontSize: 9 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: RULER_SIZE, height: RULER_SIZE, background: 'rgba(248,250,252,0.96)', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} />
      <div
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          beginGuideDrag('y', e.clientY);
        }}
        style={{ position: 'fixed', top: 0, left: RULER_SIZE, right: 0, height: RULER_SIZE, background: 'rgba(248,250,252,0.96)', borderBottom: '1px solid #cbd5e1', pointerEvents: 'auto', cursor: 'row-resize' }}
      >
        {ticks(width).map((x) => (
          <React.Fragment key={x}>
            <div style={{ position: 'absolute', left: x, bottom: 0, width: 1, height: x % MAJOR === 0 ? 14 : 7, background: '#94a3b8' }} />
            {x % MAJOR === 0 && <div style={{ position: 'absolute', left: x + 3, top: 2 }}>{x}</div>}
          </React.Fragment>
        ))}
      </div>
      <div
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          beginGuideDrag('x', e.clientX);
        }}
        style={{ position: 'fixed', top: RULER_SIZE, left: 0, bottom: 0, width: RULER_SIZE, background: 'rgba(248,250,252,0.96)', borderRight: '1px solid #cbd5e1', pointerEvents: 'auto', cursor: 'col-resize' }}
      >
        {ticks(height).map((y) => (
          <React.Fragment key={y}>
            <div style={{ position: 'absolute', right: 0, top: y, height: 1, width: y % MAJOR === 0 ? 14 : 7, background: '#94a3b8' }} />
            {y % MAJOR === 0 && <div style={{ position: 'absolute', top: y + 3, left: 2, transform: 'rotate(-90deg)', transformOrigin: 'left top' }}>{y}</div>}
          </React.Fragment>
        ))}
      </div>
      {state.rulerGuides.map((guide) => (
        <GuideLine key={guide.id} id={guide.id} axis={guide.axis} position={guide.position} />
      ))}
    </div>
  );
}

function GuideLine({ id, axis, position }: { id: string; axis: 'x' | 'y'; position: number }) {
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const onMove = (ev: PointerEvent) => {
      updateRulerGuide(id, axis === 'x' ? ev.clientX : ev.clientY);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const next = axis === 'x' ? ev.clientX : ev.clientY;
      if (next < RULER_SIZE) removeRulerGuide(id);
      else updateRulerGuide(id, next);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (axis === 'x') {
    return (
      <div
        onPointerDown={onPointerDown}
        onDoubleClick={() => removeRulerGuide(id)}
        style={{ position: 'fixed', top: 0, bottom: 0, left: position, width: 9, transform: 'translateX(-4px)', cursor: 'col-resize', pointerEvents: 'auto' }}
      >
        <div style={{ position: 'absolute', inset: '0 4px', background: '#38bdf8' }} />
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={() => removeRulerGuide(id)}
      style={{ position: 'fixed', left: 0, right: 0, top: position, height: 9, transform: 'translateY(-4px)', cursor: 'row-resize', pointerEvents: 'auto' }}
    >
      <div style={{ position: 'absolute', inset: '4px 0', background: '#38bdf8' }} />
    </div>
  );
}
