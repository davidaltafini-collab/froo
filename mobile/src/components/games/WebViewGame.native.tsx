import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { playGameHaptic, resetGameHapticThrottle } from './haptics';
import type { GameComponentProps, GameHapticKind, GameResult } from './types';

/**
 * Renders one of the canvas mini-games inside a native WebView.
 *
 * The document is a complete, self-contained HTML string generated from the web game
 * source (see scripts/build-mobile-games.mjs), so the WebView never performs a network
 * request: the games run offline, in Expo Go and in a release build alike, with no host
 * to deploy and no service to pay for.
 *
 * `baseUrl` is what gives the document a real, stable origin. Without it the page loads
 * into an opaque origin where `localStorage` throws, and the games persist their high
 * score there — the same value they draw as "HI" on the canvas.
 */
const GAME_ORIGIN = 'https://games.froo.local/';

const HAPTIC_KINDS: GameHapticKind[] = ['tick', 'impact', 'strong', 'pickup', 'levelUp', 'fail'];

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
  const [loading, setLoading] = React.useState(true);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => resetGameHapticThrottle, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const parsed: unknown = JSON.parse(event.nativeEvent.data);
      if (typeof parsed !== 'object' || parsed === null) return;
      const message = parsed as Record<string, unknown>;

      if (message.type === 'gameOver' && isGameResult(message.result)) {
        onGameOver?.(message.result);
        return;
      }
      if (message.type === 'haptic' && HAPTIC_KINDS.includes(message.kind as GameHapticKind)) {
        playGameHaptic(message.kind as GameHapticKind);
      }
    } catch {
      // Ignore anything on the bridge that is not a message we recognise.
    }
  };

  return (
    <View style={style}>
      <WebView
        key={reloadKey}
        source={{ html, baseUrl: GAME_ORIGIN }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        // The game owns the full surface; any scrolling or zooming would move the canvas
        // out from under the pointer coordinates it reads from getBoundingClientRect.
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        scalesPageToFit={false}
        // The device font scale must not resize anything: the canvas is the reference.
        textZoom={100}
        javaScriptEnabled
        domStorageEnabled
        // Hardware layer keeps the canvas compositing on the GPU during gameplay.
        androidLayerType="hardware"
        // A renderer crash leaves a blank WebView behind; remount rather than strand the player.
        onRenderProcessGone={() => setReloadKey((key) => key + 1)}
        onContentProcessDidTerminate={() => setReloadKey((key) => key + 1)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <ActivityIndicator color="#16a34a" />
        </View>
      )}
    </View>
  );
}
