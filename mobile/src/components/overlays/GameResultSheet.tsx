import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { Gift, Play, Sparkles, Trophy } from 'lucide-react-native';
import { Text } from '../Text';
import { AppPressable } from '../AppPressable';
import { LinearGradient } from '../LinearGradient';
import { SheetGrabber } from '../SheetGrabber';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { elevation, glow } from '../../theme/elevation';
import { EXTRACTION_THRESHOLD } from '../../data/extractionPrizes';
import { BISTRO } from '../../data/bistro';

export interface GameRunSummary {
  gameTitle: string;
  score: number;
  points: number;
  isNewHighScore: boolean;
  /** Prize Drop progress before and after this run, in game points (0..EXTRACTION_THRESHOLD). */
  progressBefore: number;
  progressAfter: number;
  dropUnlocked: boolean;
  triesLeft: number;
}

/** Counts a number up from 0 for the "score" moment. */
function useCountUp(target: number, durationMs: number, enabled: boolean) {
  const [value, setValue] = React.useState(enabled ? 0 : target);
  React.useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const startedAt = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, durationMs, enabled]);
  return value;
}

/**
 * The end-of-run moment: score, points banked, Prize Drop progress, and the next step.
 * Slides up over the playfield; pull it down (or tap "Back to Games") to leave.
 */
export function GameResultSheet({
  summary,
  onPlayAgain,
  onOpenDrop,
  onExit,
}: {
  summary: GameRunSummary;
  onPlayAgain: () => void;
  onOpenDrop: () => void;
  onExit: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const sheetHeight = Math.min(560, height * 0.72);
  const { dragGesture, surfaceAnimatedStyle, backdropAnimatedStyle, requestClose } = useSwipeDownSurface({
    closedOffset: sheetHeight,
    onClosed: onExit,
  });

  const score = useCountUp(summary.score, 700, !reduceMotion);

  // Progress bar fills from where it was to where this run took it (to 100% when a drop unlocks).
  const progress = useSharedValue(summary.progressBefore / EXTRACTION_THRESHOLD);
  React.useEffect(() => {
    const end = summary.dropUnlocked ? 1 : summary.progressAfter / EXTRACTION_THRESHOLD;
    progress.value = withDelay(
      reduceMotion ? 0 : 350,
      withTiming(end, { duration: reduceMotion ? 0 : 900, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [progress, reduceMotion, summary.dropUnlocked, summary.progressAfter]);
  const barStyle = useAnimatedStyle(() => ({ width: `${Math.max(0.04, progress.value) * 100}%` }));

  const canPlayAgain = summary.triesLeft > 0;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 80, justifyContent: 'flex-end' }]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.35)' }, backdropAnimatedStyle]}
      />
      <AppPressable onPress={requestClose} style={StyleSheet.absoluteFill} />
      <GestureDetector gesture={dragGesture}>
        <Animated.View
          style={[
            elevation.floating,
            {
              height: sheetHeight,
              paddingHorizontal: 24,
              paddingBottom: Math.max(24, insets.bottom + 12),
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: '#ffffff',
            },
            surfaceAnimatedStyle,
          ]}
        >
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 14 }}>
            <SheetGrabber />
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{summary.gameTitle}</Text>
            <View className="flex-row items-center" style={{ gap: 8, marginTop: 6 }}>
              {summary.isNewHighScore ? <Trophy size={22} color="#f59e0b" /> : null}
              <Text className="text-2xl font-black text-slate-900">
                {summary.isNewHighScore ? 'New high score!' : 'Nice run!'}
              </Text>
            </View>
            <Text className="font-black text-slate-900" style={{ fontSize: 56, lineHeight: 64, marginTop: 6, letterSpacing: -1.5 }}>
              {score.toLocaleString()}
            </Text>
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(450).duration(220)}
              style={[elevation.raised, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 4 }]}
            >
              <Sparkles size={16} color="#16a34a" />
              <Text className="text-sm font-bold text-green-700">+{summary.points} pts added to your balance</Text>
            </Animated.View>
          </View>

          {/* Prize Drop progress */}
          {summary.dropUnlocked ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.delay(900).duration(260)}
              style={[glow('0, 117, 63', 0.45), { marginTop: 22, borderRadius: 24, overflow: 'hidden' }]}
            >
              <LinearGradient
                colors={['#00753f', '#005c32', '#00391f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center" style={{ padding: 16, gap: 14 }}>
                <View
                  style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(250,204,21,0.2)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Gift size={26} color="#facc15" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-base font-bold text-white">Prize Drop unlocked!</Text>
                  <Text className="text-xs text-white/70" style={{ marginTop: 2 }}>
                    Win a free Froo Bistro item or bonus points
                  </Text>
                </View>
                <ExpoImage source={BISTRO.fries.image} style={{ width: 52, height: 52 }} contentFit="contain" />
              </View>
            </Animated.View>
          ) : (
            <View className="bg-slate-50" style={[elevation.well, { marginTop: 22, borderRadius: 24, padding: 16 }]}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Gift size={16} color="#64748b" />
                  <Text className="text-xs font-bold text-slate-600">Next Prize Drop</Text>
                </View>
                <Text className="text-xs font-bold text-slate-400">
                  {summary.progressAfter}/{EXTRACTION_THRESHOLD} pts
                </Text>
              </View>
              <View className="bg-slate-200" style={{ height: 8, borderRadius: 999, overflow: 'hidden' }}>
                <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: '#00c950' }, barStyle]} />
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {summary.dropUnlocked ? (
            <AppPressable
              onPress={onOpenDrop}
              className="bg-green-600 flex-row items-center justify-center"
              style={[glow('0, 166, 62', 0.5), { paddingVertical: 16, borderRadius: 18, gap: 8 }]}
            >
              <Gift size={18} color="#ffffff" />
              <Text className="text-base font-bold text-white">Open Prize Drop</Text>
            </AppPressable>
          ) : (
            <AppPressable
              onPress={onPlayAgain}
              disabled={!canPlayAgain}
              className="flex-row items-center justify-center"
              style={[
                canPlayAgain ? glow('0, 166, 62', 0.5) : elevation.well,
                { paddingVertical: 16, borderRadius: 18, gap: 8, backgroundColor: canPlayAgain ? '#16a34a' : '#f1f5f9' },
              ]}
            >
              {canPlayAgain ? <Play size={18} color="#ffffff" fill="#ffffff" /> : null}
              <Text className={`text-base font-bold ${canPlayAgain ? 'text-white' : 'text-slate-400'}`}>
                {canPlayAgain
                  ? `Play again · ${summary.triesLeft} ${summary.triesLeft === 1 ? 'try' : 'tries'} left`
                  : 'No tries left for now'}
              </Text>
            </AppPressable>
          )}
          <AppPressable onPress={requestClose} style={{ paddingVertical: 14, alignItems: 'center' }}>
            <Text className="text-sm font-bold text-slate-500">Back to Games</Text>
          </AppPressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
