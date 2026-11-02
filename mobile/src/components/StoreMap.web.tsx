import React from 'react';
import { View } from 'react-native';
import type { Store } from '../types';

export function StoreMap({ src, title }: { src: string; title: string; selectedStore?: Store; userLocation?: { lat: number; lng: number } | null }) {
  return (
    <View style={{ flex: 1 }}>
      {React.createElement('iframe', {
        src,
        title,
        loading: 'lazy',
        referrerPolicy: 'no-referrer-when-downgrade',
        style: { width: '100%', height: '100%', border: 0 },
      })}
    </View>
  );
}
