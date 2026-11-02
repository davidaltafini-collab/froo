import { Dimensions, useWindowDimensions } from 'react-native';

// Reference frame the original design was built against (iPhone-sized mobile viewport,
// matching the web app's own `max-w-[425px]` mobile-first frame). All vw/vh/ms helpers
// scale proportionally from this baseline to whatever device the app is actually running on.
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function vwOf(width: number, percent: number) {
  return (percent / 100) * width;
}

export function vhOf(height: number, percent: number) {
  return (percent / 100) * height;
}

/** Scales a fixed px value designed against the 375x812 reference frame to the current device width. */
export function msOf(width: number, size: number) {
  return size * (width / BASE_WIDTH);
}

/** Reactive responsive helpers — use inside components/hooks (updates on rotation/resize). */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    vw: (percent: number) => vwOf(width, percent),
    vh: (percent: number) => vhOf(height, percent),
    ms: (size: number) => msOf(width, size),
  };
}

// Non-reactive helpers for module-level constants / state initializers, where a hook can't be used.
const initialWindow = Dimensions.get('window');
export const vw = (percent: number) => vwOf(initialWindow.width, percent);
export const vh = (percent: number) => vhOf(initialWindow.height, percent);
export const ms = (size: number) => msOf(initialWindow.width, size);

export { BASE_WIDTH, BASE_HEIGHT };
