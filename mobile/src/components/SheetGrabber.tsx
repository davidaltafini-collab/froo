import Svg, { Path } from 'react-native-svg';

/**
 * Drag affordance at the top of every bottom sheet — the native twin of
 * `src/components/SheetGrabber.tsx`.
 *
 * The path is the same flattened Froo curve in the same 48x13 viewBox, so both renderers
 * draw identical geometry. The default colour is the `slate-200` the previous pill used.
 */
export const SHEET_GRABBER_PATH =
  'M27.653,6.121C9.534,4.919 1.057,13.207 0.846,12.226C0.775,11.895 -0.018,8.202 0.000,8.078C0.082,7.534 16.759,-5.244 37.852,2.468C42.736,4.253 47.820,7.623 47.918,8.087C47.928,8.134 47.182,12.318 46.953,12.338C46.779,12.353 40.737,8.239 31.828,6.658C31.070,6.524 31.075,6.542 27.653,6.121Z';

/** Design units of the artwork. Callers scale by the surface's design scale. */
export const SHEET_GRABBER_WIDTH = 48;
export const SHEET_GRABBER_HEIGHT = 13;

/**
 * Design-unit gap between a sheet's top edge and the grabber, shared by every sheet.
 *
 * Each sheet used to derive this from its own padding, which ranged from 3.5 to 32 units, so
 * the affordance sat in a visibly different place on each surface. One constant keeps them
 * aligned; sheets whose own padding differs cancel it out rather than inventing a new value.
 */
export const SHEET_GRABBER_TOP_GAP = 8;

export function SheetGrabber({
  scale = 1,
  color = '#e2e8f0',
}: {
  scale?: number;
  color?: string;
}) {
  return (
    <Svg
      width={SHEET_GRABBER_WIDTH * scale}
      height={SHEET_GRABBER_HEIGHT * scale}
      viewBox={`0 0 ${SHEET_GRABBER_WIDTH} ${SHEET_GRABBER_HEIGHT}`}
    >
      <Path d={SHEET_GRABBER_PATH} fill={color} />
    </Svg>
  );
}
