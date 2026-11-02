import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { cssInterop } from 'nativewind';

import { familyForWeight } from '../theme/fonts';

/** Shared weight→family resolution for both text primitives. */
function withInter(style: TextProps['style'] | TextInputProps['style']): TextStyle {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  // `font-mono` (order codes, the loyalty barcode label) is deliberately not Inter — leave any
  // explicitly-requested family alone and only fill in the one we own.
  if (typeof flat.fontFamily === 'string' && flat.fontFamily.length > 0) return flat;

  return {
    ...flat,
    fontFamily: familyForWeight(flat.fontWeight, flat.fontStyle === 'italic'),
    // The family already carries the weight and slant. Leaving the original values on the style
    // makes Android synthesise a second, doubled-up bold/oblique on top of a face that is
    // already bold/oblique.
    fontWeight: undefined,
    fontStyle: undefined,
  };
}

/**
 * Drop-in replacement for react-native's `Text` that resolves the requested weight to the
 * matching embedded Inter family. Every screen imports `Text` from here instead of from
 * 'react-native' so the substitution is total — a single bare RN `Text` anywhere in the tree
 * would render in the platform default and read as a visible typeface mismatch.
 *
 * See `theme/fonts.ts` for why the weight has to become a family name rather than staying a
 * `fontWeight`.
 */
function AppText({ style, allowFontScaling = false, ...rest }: TextProps) {
  return <RNText {...rest} allowFontScaling={allowFontScaling} style={withInter(style)} />;
}

function AppTextInput({ style, allowFontScaling = false, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} allowFontScaling={allowFontScaling} style={withInter(style)} />;
}

// NativeWind only rewrites `className` into `style` for components it knows about. Without these
// registrations every one of the app's Tailwind text classes would silently stop applying.
cssInterop(AppText, { className: 'style' });
cssInterop(AppTextInput, { className: 'style' });

export { AppText as Text, AppTextInput as TextInput };
export type { TextProps, TextInputProps };
