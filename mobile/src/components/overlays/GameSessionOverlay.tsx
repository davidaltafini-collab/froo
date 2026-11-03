import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { GameDefinition, GameResult } from '../games/types';
import { AppPressable } from '../AppPressable';
import iconGameSession from '../../../assets/brand/icon-game-session-header.png';
import mascotGamesImg from '../../../assets/brand/mascot-games-float.png';
import { elevation } from '../../theme/elevation';
import { GameResultSheet, type GameRunSummary } from './GameResultSheet';
interface GameSessionOverlayProps {
  game: GameDefinition;
  /** Set once a run ends; shows the results sheet over the playfield. */
  summary: GameRunSummary | null;
  onExit: () => void;
  onGameOver: (result: GameResult) => void;
  onPlayAgain: () => void;
  onOpenDrop: () => void;
}

export function GameSessionOverlay({ game, summary, onExit, onGameOver, onPlayAgain, onOpenDrop }: GameSessionOverlayProps) {
  const GameComponent = game.Component;
  // Bumped on "Play again" to remount the game, which starts a fresh run.
  const [runKey, setRunKey] = React.useState(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const shouldReduceMotion = useReducedMotion();

  // The accepted 48px header inset already clears the Galaxy status bar; the guards only
  // take effect on devices whose safe area is deeper (notches, gesture bars), where the
  // playfield would otherwise be clipped by system chrome.
  const headerPaddingTop = Math.max(48, insets.top + 8);
  const playfieldPaddingBottom = Math.max(32, insets.bottom + 8);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[StyleSheet.absoluteFill, { zIndex: 60, backgroundColor: '#ffffff' }]}
    >
      <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: headerPaddingTop }}>
        <View className="flex-row items-center gap-2">
          <ExpoImage source={iconGameSession} style={{ width: 54, height: 53 }} contentFit="contain" />
          <Text className="font-bold text-slate-800 text-sm">{game.title}</Text>
        </View>
        <AppPressable onPress={onExit} className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center" style={elevation.raised}>
          <X size={16} color="#64748b" />
        </AppPressable>
      </View>

      <View className="flex-1 items-center justify-center px-4" style={{ paddingBottom: playfieldPaddingBottom }}>
        <GameComponent key={runKey} onGameOver={onGameOver} />
      </View>

      {/*
        Brand mascot for the active session, matching the approved Photoshop reference for both
        games (same "games" artwork used on the Games list). Bleeds slightly past the right edge
        on purpose — the Dashboard mascot uses the same intentional overflow. First-pass geometry;
        pending a pixel-diff pass against the reference once it is on disk.
      */}
      <Animated.View
        pointerEvents="none"
        entering={FadeIn.duration(shouldReduceMotion ? 0 : 140)}
        style={{
          position: 'absolute',
          zIndex: 20,
          right: -width * 0.035,
          bottom: Math.max(24, insets.bottom + 16),
          width: width * 0.32,
          aspectRatio: 0.6916,
        }}
      >
        <ExpoImage
          source={mascotGamesImg}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
      {summary ? (
        <GameResultSheet
          summary={summary}
          onExit={onExit}
          onOpenDrop={onOpenDrop}
          onPlayAgain={() => {
            setRunKey((key) => key + 1);
            onPlayAgain();
          }}
        />
      ) : null}
    </Animated.View>
  );
}
