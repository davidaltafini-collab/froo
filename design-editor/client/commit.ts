// Turns a final on-screen position/size into staged Tailwind class edits. Shared by
// the drag/resize gestures in SelectionBox.tsx and the numeric X/Y/W/H fields in
// PropertiesPanel.tsx so both paths produce identical output for the same result.
import type { Basis, PromoteResult } from './dom-utils';
import { formatMeasurement } from './dom-utils';
import { stageClassTokenBatch, stageClassTokens } from './store';

export function stageMoveClasses(id: string, top: number, left: number, width: number, height: number, basis: Basis) {
  stageClassTokenBatch(id, [
    { category: 'position-mode', tokens: ['absolute'] },
    {
      category: 'position-offset',
      tokens: [
        `top-[${formatMeasurement(top, basis.heightPx, basis.heightReliable)}]`,
        `left-[${formatMeasurement(left, basis.widthPx, basis.widthReliable)}]`,
      ],
    },
    { category: 'width', tokens: [`w-[${formatMeasurement(width, basis.widthPx, basis.widthReliable)}]`] },
    { category: 'height', tokens: [`h-[${formatMeasurement(height, basis.heightPx, basis.heightReliable)}]`] },
  ]);
}

export function stageParentRelativeIfNeeded(promoted: PromoteResult) {
  if (!promoted.parentNeedsRelative) return;
  const parentId = promoted.offsetParent.dataset.vleId;
  if (parentId) stageClassTokens(parentId, 'position-mode', ['relative'], false);
}

export function stageResizeClasses(id: string, width: number, height: number, basis: Basis, staysFlexChild: boolean) {
  const widthToken = `w-[${formatMeasurement(width, basis.widthPx, basis.widthReliable)}]`;
  const heightToken = `h-[${formatMeasurement(height, basis.heightPx, basis.heightReliable)}]`;
  stageClassTokenBatch(id, [
    { category: 'width', tokens: staysFlexChild ? [widthToken, 'shrink-0'] : [widthToken] },
    { category: 'height', tokens: [heightToken] },
  ]);
}

export function stageRotationClass(id: string, degrees: number) {
  const rounded = Math.round(degrees * 10) / 10;
  stageClassTokens(id, 'rotation', [`rotate-[${rounded}deg]`], true);
}
