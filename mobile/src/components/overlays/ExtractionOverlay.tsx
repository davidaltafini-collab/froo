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
import { Gift, Sparkles, X } from 'lucide-react-native';
import type { ExtractionPrize } from '../../types';
import { RARITY_COLORS, REEL_TARGET_INDEX, buildReel, pickWeightedPrize } from '../../data/extractionPrizes';
import { useAppContext } from '../../context/AppContext';
import { AppPressable } from '../AppPressable';
import { imageSource, isCutout } from '../../theme/image';

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
        borderWidth: 2 * size,
        borderColor: color,
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
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
      <View style={{ paddingHorizontal: 6, paddingTop: 4, width: '100%' }}>
        <Text numberOfLines={1} style={{ color: '#1e293b', fontSize: 10 * size, fontWeight: '800', textAlign: 'center' }}>
          {prize.kind === 'points' ? `+${prize.pointsValue}` : prize.name}
        </Text>
      </View>
    </View>
  );
}

export function ExtractionOverlay({ onClose }: { onClose: () => void }) {
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

  const reveal = React.useCallback(() => {
    setPhase('revealed');
    landingHaptic(winner);
    claimPrize(winner);
  }, [claimPrize, winner]);

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

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { zIndex: 200, backgroundColor: '#f8fafc' }]}>
      <View
        style={{
          paddingTop: Math.max(48, insets.top + 8),
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Gift size={20} color="#16a34a" />
          <Text style={{ color: '#1e293b', fontWeight: '800', fontSize: 16 }}>Prize Drop</Text>
        </View>
        {phase !== 'spinning' ? (
          <AppPressable
            onPress={onClose}
            className="border border-slate-100"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#64748b" />
          </AppPressable>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Math.max(24, insets.bottom + 16) }}>
        <View style={{ width, height: CARD_H + 24, overflow: 'hidden', justifyContent: 'center' }}>
          <Animated.View style={[{ flexDirection: 'row', gap: CARD_GAP, paddingLeft: viewportCenter - CARD_W / 2 }, reelStyle]}>
            {reel.map((prize, index) => (
              <PrizeCard key={`${prize.id}-${index}`} prize={prize} />
            ))}
          </Animated.View>

          {/* Centre marker */}
          <View pointerEvents="none" style={{ position: 'absolute', left: viewportCenter - 1, top: 0, bottom: 0, width: 2, backgroundColor: '#16a34a' }} />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: viewportCenter - 8,
              top: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#16a34a',
              borderWidth: 2,
              borderColor: '#ffffff',
            }}
          />
        </View>

        {phase === 'revealed' ? (
          <Animated.View style={[{ alignItems: 'center', marginTop: 40, paddingHorizontal: 32 }, resultStyle]}>
            <Text style={{ color: winnerColor, fontWeight: '800', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              {winner.rarity} drop
            </Text>
            <Text style={{ color: '#1e293b', fontWeight: '900', fontSize: 26, textAlign: 'center', marginBottom: 6 }}>
              {winner.kind === 'points' ? `+${winner.pointsValue} Points!` : winner.name}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>
              {winner.kind === 'points' ? 'Added to your balance' : 'Added to Rewards — redeem on the Offers page'}
            </Text>
            <AppPressable
              onPress={onClose}
              style={{ backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Nice!</Text>
            </AppPressable>
          </Animated.View>
        ) : (
          <View style={{ marginTop: 40, alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              You earned a Prize Drop from playing Froo Games. Open it for a free item or bonus points.
            </Text>
            <AppPressable
              onPress={start}
              disabled={phase === 'spinning'}
              style={{
                backgroundColor: phase === 'spinning' ? '#e2e8f0' : '#16a34a',
                paddingHorizontal: 36,
                paddingVertical: 16,
                borderRadius: 18,
                opacity: phase === 'spinning' ? 0.7 : 1,
              }}
            >
              <Text style={{ color: phase === 'spinning' ? '#94a3b8' : '#fff', fontWeight: '800', fontSize: 16 }}>
                {phase === 'spinning' ? 'Opening…' : 'Open Prize Drop'}
              </Text>
            </AppPressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
