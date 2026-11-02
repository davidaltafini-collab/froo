import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export function BackdropBlur() {
  return (
    <BlurView
      pointerEvents="none"
      intensity={20}
      tint="default"
      experimentalBlurMethod="dimezisBlurView"
      style={StyleSheet.absoluteFill}
    />
  );
}
