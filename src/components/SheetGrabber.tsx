/**
 * Drag affordance at the top of every bottom sheet.
 *
 * The shape is the Froo curve rather than a plain pill. Its source artwork nests three
 * transforms; they are flattened into the path below so both this component and its React
 * Native counterpart draw identical geometry straight in the 48x13 viewBox.
 *
 * Colour comes from `currentColor`, so callers keep setting it with the same
 * `text-slate-200` token the old pill used as `bg-slate-200`.
 */
export const SHEET_GRABBER_PATH =
  'M27.653,6.121C9.534,4.919 1.057,13.207 0.846,12.226C0.775,11.895 -0.018,8.202 0.000,8.078C0.082,7.534 16.759,-5.244 37.852,2.468C42.736,4.253 47.820,7.623 47.918,8.087C47.928,8.134 47.182,12.318 46.953,12.338C46.779,12.353 40.737,8.239 31.828,6.658C31.070,6.524 31.075,6.542 27.653,6.121Z';

export const SHEET_GRABBER_WIDTH = 48;
export const SHEET_GRABBER_HEIGHT = 13;

export function SheetGrabber({ className = '' }: { className?: string }) {
  return (
    <svg
      width={SHEET_GRABBER_WIDTH}
      height={SHEET_GRABBER_HEIGHT}
      viewBox={`0 0 ${SHEET_GRABBER_WIDTH} ${SHEET_GRABBER_HEIGHT}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={SHEET_GRABBER_PATH} fill="currentColor" />
    </svg>
  );
}
