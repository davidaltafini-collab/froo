/**
 * Images in the data layer are either remote URLs (string) or bundled assets (the number
 * Metro returns from `import x from './x.webp'`). `imageSource` turns either into a value
 * expo-image and react-native-svg accept.
 */
export type ImageRef = string | number;

export function imageSource(ref: ImageRef) {
  return typeof ref === 'number' ? ref : { uri: ref };
}

/** Bundled bistro photos are transparent cut-outs: show them whole, never cropped. */
export function isCutout(ref: ImageRef | undefined) {
  return typeof ref === 'number';
}
