import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Drop-in `Pressable` replacement that fires a light haptic tap on every press —
 * the RN equivalent of the web app's global `document` click listener that called
 * `navigator.vibrate(10)` for every button/link tap. RN has no DOM to attach a
 * capture-phase listener to, so every interactive element in the app uses this
 * instead of the raw `Pressable`.
 */
export const AppPressable = React.forwardRef<React.ElementRef<typeof Pressable>, PressableProps>(
  ({ onPress, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        {...props}
      />
    );
  },
);
AppPressable.displayName = 'AppPressable';
