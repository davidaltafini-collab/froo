import React from 'react';
import { View, type ViewStyle } from 'react-native';
import type { GameComponentProps, GameResult } from './types';

/**
 * Expo Web counterpart of the native WebView host. It renders the same self-contained
 * game document through `srcDoc`, so the browser build has no dev-server dependency
 * either, and receives results over `postMessage` instead of the native bridge.
 */
function isGameResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.score === 'number' &&
    typeof candidate.highScore === 'number' &&
    typeof candidate.isNewHighScore === 'boolean'
  );
}

export function WebViewGame({ html, style, onGameOver }: GameComponentProps & { html: string; style: ViewStyle }) {
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'FROO_GAME_MESSAGE') return;
      const message = event.data.message;
      // Haptics are dropped here on purpose: the browser build has no taptic engine.
      if (message?.type === 'gameOver' && isGameResult(message.result)) onGameOver?.(message.result);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onGameOver]);

  return (
    <View style={style}>
      {React.createElement('iframe', {
        srcDoc: html,
        title: 'Froo mini game',
        allow: 'autoplay',
        style: { width: '100%', height: '100%', border: 0, display: 'block', background: 'white' },
      })}
    </View>
  );
}
