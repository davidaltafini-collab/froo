import React from 'react';
import { StyleSheet, View } from 'react-native';

export function BackdropBlur() {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } as never,
      ]}
    />
  );
}
