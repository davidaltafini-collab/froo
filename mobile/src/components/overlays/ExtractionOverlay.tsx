import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, QrCode, Sparkles, X } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { ExtractionPrize } from '../../types';
import { RARITY_COLORS, REEL_TARGET_INDEX, buildReel, pickWeightedPrize } from '../../data/extractionPrizes';
import { useAppContext } from '../../context/AppContext';
import { AppPressable } from '../AppPressable';
import { imageSource, isCutout } from '../../theme/image';
import { elevation, glow } from '../../theme/elevation';
const CARD_W = 108;
const CARD_H = 132;
const CARD_GAP = 14;
const STEP = CARD_W + CARD_GAP;
const SPIN_DURATION = 5200;
const REDUCED_MOTION_SPIN_DURATION = 400;

/** Fires a light tick each time the reel crosses a card boundary, throttled from the UI thread. */
function useReelTickHaptic() {
  const lastTick = React.useRef(0);
  return React.useCallback(() => {
    const now = Date.now();
    if (now - lastTick.current < 45) return;
    lastTick.current = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
}

function landingHaptic(prize: ExtractionPrize) {
  if (prize.rarity === 'legendary' || prize.rarity === 'epic') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 130);
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

function PrizeCard({ prize, size = 1 }: { prize: ExtractionPrize; size?: number }) {
  const color = RARITY_COLORS[prize.rarity];
  return (
    <View
      style={{
        width: CARD_W * size,
        height: CARD_H * size,
        borderRadius: 18 * size,
        backgroundColor: '#ffffff',
        // Rarity reads from a tinted glow and the label plate, not a coloured outline.
        boxShadow: `0 10px 22px -10px ${color}, 0 1px 2px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)`,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {prize.kind === 'product' && prize.image ? (
        <ExpoImage
          source={imageSource(prize.image)}
          style={{ width: '100%', height: '72%', backgroundColor: isCutout(prize.image) ? '#fbf3e8' : undefined }}
          contentFit={isCutout(prize.image) ? 'contain' : 'cover'}
        />
      ) : (
        <View style={{ width: '100%', height: '72%', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}1a` }}>
          <Sparkles size={30 * size} color={color} />
        </View>
      )}
      <View style={{ paddingHorizontal: 6, paddingTop: 4, width: '100%', flex: 1, justifyContent: 'center', backgroundColor: `${color}1f` }}>
        <Text numberOfLines={1} style={{ color: '#1e293b', fontSize: 10 * size, fontWeight: '800', textAlign: 'center' }}>
          {prize.kind === 'points' ? `+${prize.pointsValue}` : prize.name}
        </Text>
      </View>
    </View>
  );
}

export function ExtractionOverlay({ onClose, onUseNow }: { onClose: () => void; onUseNow?: (wonPrizeId: string) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { claimPrize } = useAppContext();
  const shouldReduceMotion = useReducedMotion();

  const [winner] = React.useState<ExtractionPrize>(() => pickWeightedPrize());
  const [reel] = React.useState<ExtractionPrize[]>(() => buildReel(winner));
  const [phase, setPhase] = React.useState<'idle' | 'spinning' | 'revealed'>('idle');
  const translateX = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0.8);
  const tick = useReelTickHaptic();
  const lastIndexRef = React.useRef(0);

  React.useEffect(() => {
    if (phase !== 'revealed') return;
    resultOpacity.value = withTiming(1, { duration: 260 });
    resultScale.value = withSequence(withTiming(1.12, { duration: 220 }), withTiming(1, { duration: 160 }));
  }, [phase, resultOpacity, resultScale]);

  const viewportCenter = width / 2;
  // The reel's `paddingLeft` (viewportCenter - CARD_W/2) already centers card 0 under the
  // marker at translateX 0, so landing card i under the marker is just -i * STEP — no
  // viewportCenter or CARD_W term belongs here, that was double-counting the padding offset.
  const jitter = React.useRef((Math.random() - 0.5) * CARD_W * 0.4).current;
  const targetX = -REEL_TARGET_INDEX * STEP + jitter;

  const [wonId, setWonId] = React.useState<string | null>(null);
  const reveal = React.useCallback(() => {
    setPhase('revealed');
    landingHaptic(winner);
    setWonId(claimPrize(winner));
  }, [claimPrize, winner]);

  // Pull the page down to leave (disabled while the reel is spinning so a prize can't be skipped).
  const { height: windowHeight } = useWindowDimensions();
  const dragY = useSharedValue(0);
  const canDismiss = phase !== 'spinning';
  const dismissGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(canDismiss)
        .maxPointers(1)
        .activeOffsetY(10)
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          dragY.value = Math.max(0, event.translationY);
        })
        .onEnd((event) => {
          if (dragY.value > windowHeight * 0.18 || event.velocityY > 850) {
            dragY.value = withTiming(windowHeight, { duration: 210, easing: Easing.bezier(0.32, 0, 0.67, 0) }, (finished) => {
              if (finished) runOnJS(onClose)();
            });
          } else {
            dragY.value = withTiming(0, { duration: 180 });
          }
        }),
    [canDismiss, dragY, onClose, windowHeight],
  );
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    borderRadius: dragY.value > 1 ? 28 : 0,
  }));

  const onFrameIndexChange = React.useCallback((index: number) => {
    if (shouldReduceMotion || index === lastIndexRef.current) return;
    lastIndexRef.current = index;
    tick();
  }, [shouldReduceMotion, tick]);

  const reelStyle = useAnimatedStyle(() => {
    const index = Math.round(-translateX.value / STEP);
    runOnJS(onFrameIndexChange)(index);
    return { transform: [{ translateX: translateX.value }] };
  });

  const start = () => {
    if (phase !== 'idle') return;
    setPhase('spinning');
    translateX.value = withTiming(
      targetX,
      {
        duration: shouldReduceMotion ? REDUCED_MOTION_SPIN_DURATION : SPIN_DURATION,
        easing: Easing.bezier(0.1, 0.62, 0.12, 1),
      },
      (finished) => {
        if (finished) runOnJS(reveal)();
      },
    );
  };

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }));

  const winnerColor = RARITY_COLORS[winner.rarity];

  const isProduct = winner.kind === 'product';

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { zIndex: 200, backgroundColor: 'rgba(15,23,42,0.35)' }]}>
      <GestureDetector gesture={dismissGesture}>
      <Animated.View style={[{ flex: 1, backgroundColor: '#f8fafc', overflow: 'hidden' }, dragStyle]}>
      <View
        style={{
          paddingTop: Math.max(48, insets.top + 8),
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Gift size={20} color="#16a34a" />
          <Text style={{ color: '#1e293b', fontWeight: '800', fontSize: 16 }}>Prize Drop</Text>
        </View>
        {phase !== 'spinning' ? (
          <AppPressable
            onPress={onClose}
            style={[elevation.raised, { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }]}
          >
            <X size={18} color="#64748b" />
          </AppPressable>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Math.max(24, insets.bottom + 16) }}>
        {phase !== 'revealed' ? (
          <>
            <View style={{ width, height: CARD_H + 40, overflow: 'hidden', justifyContent: 'center' }}>
              <Animated.View style={[{ flexDirection: 'row', gap: CARD_GAP, paddingLeft: viewportCenter - CARD_W / 2 }, reelStyle]}>
                {reel.map((prize, index) => (
                  <PrizeCard key={`${prize.id}-${index}`} prize={prize} />
                ))}
              </Animated.View>

              {/* Centre marker */}
              <View pointerEvents="none" style={{ position: 'absolute', left: viewportCenter - 1, top: 6, bottom: 6, width: 2, borderRadius: 1, backgroundColor: '#16a34a' }} />
              <View
                pointerEvents="none"
                style={[glow('22, 163, 74', 0.6), {
                  position: 'absolute',
                  left: viewportCenter - 7,
                  top: 0,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#16a34a',
                }]}
              />
            </View>

            <View style={{ marginTop: 40, alignItems: 'center', paddingHorizontal: 32 }}>
              <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 24 }}>
                You earned a Prize Drop from playing Froo Games. Open it for a free Froo Bistro item or bonus points.
              </Text>
              <AppPressable
                onPress={start}
                disabled={phase === 'spinning'}
                style={[
                  phase === 'spinning' ? elevation.well : glow('22, 163, 74', 0.5),
                  {
                    backgroundColor: phase === 'spinning' ? '#f1f5f9' : '#16a34a',
                    paddingHorizontal: 36,
                    paddingVertical: 16,
                    borderRadius: 18,
                  },
                ]}
              >
                <Text style={{ color: phase === 'spinning' ? '#94a3b8' : '#fff', fontWeight: '800', fontSize: 16 }}>
                  {phase === 'spinning' ? 'Opening…' : 'Open Prize Drop'}
                </Text>
              </AppPressable>
            </View>
          </>
        ) : (
          <Animated.View style={[{ alignItems: 'center', width: '100%', paddingHorizontal: 24 }, resultStyle]}>
            <View
              style={[
                {
                  width: '100%',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 24,
                  borderRadius: 28,
                  backgroundColor: '#ffffff',
                  boxShadow: `0 18px 40px -18px ${winnerColor}, 0 1px 2px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)`,
                },
              ]}
            >
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${winnerColor}24` }}>
                <Text style={{ color: winnerColor, fontWeight: '800', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                  {winner.rarity} drop
                </Text>
              </View>

              {isProduct && winner.image !== undefined ? (
                <View style={{ width: 184, height: 150, marginTop: 14, borderRadius: 24, backgroundColor: '#fbf3e8', alignItems: 'center', justifyContent: 'center' }}>
                  <ExpoImage source={imageSource(winner.image)} style={{ width: '88%', height: '88%' }} contentFit={isCutout(winner.image) ? 'contain' : 'cover'} />
                </View>
              ) : (
                <View style={{ width: 120, height: 120, marginTop: 14, borderRadius: 60, backgroundColor: `${winnerColor}1f`, alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={48} color={winnerColor} />
                </View>
              )}

              <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 26, textAlign: 'center', marginTop: 16 }}>
                {isProduct ? winner.name : `+${winner.pointsValue} points`}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 }}>
                {isProduct ? 'Free at any froo Bistro. Show the QR code at the counter.' : 'Added to your balance.'}
              </Text>
            </View>

            {isProduct && onUseNow && wonId ? (
              <>
                <AppPressable
                  onPress={() => onUseNow(wonId)}
                  style={[glow('22, 163, 74', 0.5), { marginTop: 28, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 18 }]}
                >
                  <QrCode size={18} color="#ffffff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Use it now</Text>
                </AppPressable>
                <AppPressable onPress={onClose} style={{ paddingVertical: 14 }}>
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 14 }}>Save for later (in Offers)</Text>
                </AppPressable>
              </>
            ) : (
              <AppPressable
                onPress={onClose}
                style={[glow('22, 163, 74', 0.5), { marginTop: 28, width: '100%', alignItems: 'center', backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 18 }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Awesome!</Text>
              </AppPressable>
            )}
          </Animated.View>
        )}
      </View>
      </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
