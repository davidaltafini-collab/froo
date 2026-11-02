import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

/**
 * NativeWind only translates `className` for React Native primitives by default. Register Expo's
 * gradient once so its Tailwind dimensions, positioning, radius, padding, and alignment become
 * real native styles instead of being silently ignored on iOS and Android.
 */
export const LinearGradient = cssInterop(ExpoLinearGradient, { className: 'style' });
