/**
 * Images in the data layer are either remote URLs (string) or bundled assets (the number
 * Metro returns from `import x from './x.webp'`). `imageSource` turns either into a value
 * expo-image and react-native-svg accept.
 */
export type ImageRef = string | number;

// Note: a bundled asset is a number on iOS/Android but an object on web, so test for string.
export function imageSource(ref: ImageRef) {
  return typeof ref === 'string' ? { uri: ref } : ref;
}

/** Bundled bistro photos are transparent cut-outs: show them whole, never cropped. */
export function isCutout(ref: ImageRef | undefined) {
  return ref != null && typeof ref !== 'string';
}
