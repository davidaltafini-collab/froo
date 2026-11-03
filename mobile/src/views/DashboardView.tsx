import React from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '../components/Text';
import { LinearGradient } from '../components/LinearGradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DeviceMotion } from 'expo-sensors';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  Award,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gift,
  Leaf,
  MapPin,
  QrCode,
  ShoppingBag,
} from 'lucide-react-native';

import { OFFERS, TRANSACTIONS } from '../data/mockData';
import { ActionBtn } from '../components/SharedUI';
import { AppPressable } from '../components/AppPressable';
import { useAppContext } from '../context/AppContext';
import FrooMark from '../../assets/brand/logo-mark.svg';
import FrogHandIcon from '../../assets/brand/froghand-hand.svg';
import mascotFloatImg from '../../assets/brand/mascot-dashboard-float.png';
import FrooGamesBg from '../../assets/brand/froogames-bg.svg';

/** Matches the web card wrapper's `style={{ perspective: 1000 }}`. */
const CARD_PERSPECTIVE = 1000;
const CARD_SPRING = { stiffness: 300, damping: 30, mass: 1 } as const;
/** Max rotation at full tilt/drag. Requested more exaggerated movement than the original 8deg. */
const MAX_TILT_DEG = 16;

/**
 * Both platforms render the same real 3D rotation, and the copy rides inside it so the two can
 * never separate into intersecting planes.
 *
 * What made that copy look pixelated on iOS was not the rotation itself: a `borderRadius` with
 * `overflow: 'hidden'` makes UIKit clip through a mask layer, and a masked layer under a 3D
 * transform has to be composited offscreen. Core Animation rasterizes that buffer at a scale that
 * defaults to 1.0 rather than the Retina scale, so every glyph inside it is drawn once at a third
 * of the density the screen actually has. The clipping therefore lives on the artwork wrapper
 * below — which holds no text — and the tilted layer carries no mask of its own. See
 * https://github.com/facebook/react-native/issues/32886 for the same class of bug.
 */

const STREAK_DAYS = [
  { day: 'Mon', checked: true, pts: '+5' },
  { day: 'Tue', checked: true, pts: '+10' },
  { day: 'Wed', checked: false, pts: '+15', current: true },
  { day: 'Thu', checked: false, pts: '+20' },
  { day: 'Fri', checked: false, pts: '+25' },
  { day: 'Sat', checked: false, pts: '+30' },
  { day: 'Sun', checked: false, pts: '+50' },
];

function LoyaltyCardTexture() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox="0 0 361 228"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <Pattern id="loyalty-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <Circle cx="2" cy="2" r="1" fill="#ffffff" fillOpacity={0.13} />
        </Pattern>
        <RadialGradient id="loyalty-light" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.06} />
          <Stop offset="0.42" stopColor="#ffffff" stopOpacity={0.04} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="loyalty-dark" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.18} />
          <Stop offset="0.5" stopColor="#000000" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="392" cy="32" r="160" fill="url(#loyalty-light)" />
      <Circle cx="40" cy="268" r="120" fill="url(#loyalty-dark)" />
      <Rect width="361" height="228" fill="url(#loyalty-dots)" />
    </Svg>
  );
}

function GamesCardTexture() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox="0 0 361 98"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <RadialGradient id="games-right-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#f0fdf4" stopOpacity={0.95} />
          <Stop offset="0.46" stopColor="#f0fdf4" stopOpacity={0.62} />
          <Stop offset="1" stopColor="#f0fdf4" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="games-left-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#ecfdf5" stopOpacity={0.82} />
          <Stop offset="0.48" stopColor="#ecfdf5" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#ecfdf5" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="337" cy="24" r="92" fill="url(#games-right-glow)" />
      <Circle cx="88" cy="50" r="68" fill="url(#games-left-glow)" />
    </Svg>
  );
}

function Particle({ onDone, designScale }: { onDone: () => void; designScale: number }) {
  const progress = useSharedValue(0);
  const dx = React.useRef((Math.random() - 0.5) * 150 * designScale).current;
  const dy = React.useRef((-150 - Math.random() * 200) * designScale).current;

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 800 + Math.random() * 400 });
    const id = setTimeout(onDone, 2000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 1], [1, 1, 0]),
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.5, 1.5, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 23 * designScale,
          right: 40 * designScale,
          zIndex: 100,
        },
        style,
      ]}
    >
      <Text
        className="text-green-500 font-black"
        style={{ fontSize: 20 * designScale, lineHeight: 24 * designScale }}
      >
        +15
      </Text>
    </Animated.View>
  );
}

export function DashboardView() {
  const { width: windowWidth } = useWindowDimensions();
  const designScale = windowWidth / 425;

  const {
    setShowQR,
    setShowPersonalGame,
    setShowRewards,
    setShowHistory,
    setActiveTab,
    currentPoints,
    setCurrentPoints,
  } = useAppContext();

  const [claimed, setClaimed] = React.useState(false);
  const [displayPoints, setDisplayPoints] = React.useState(currentPoints);
  const [particleIds, setParticleIds] = React.useState<number[]>([]);

  const cardWidth = useSharedValue(0);
  const cardHeight = useSharedValue(0);
  const tiltX = useSharedValue(0); // normalized -0.5..0.5
  const tiltY = useSharedValue(0);
  const panActive = useSharedValue(0);

  React.useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    (async () => {
      try {
        const { status } = await DeviceMotion.requestPermissionsAsync();
        if (status !== 'granted') return;
        DeviceMotion.setUpdateInterval(50);
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation || panActive.value === 1) return;
          const gammaDeg = rotation.gamma * (180 / Math.PI);
          const betaDeg = rotation.beta * (180 / Math.PI);
          const clampedX = Math.max(-45, Math.min(45, gammaDeg));
          const clampedY = Math.max(-45, Math.min(45, betaDeg - 45));
          tiltX.value = withSpring((clampedX / 45) * 0.5, CARD_SPRING);
          tiltY.value = withSpring((clampedY / 45) * 0.5, CARD_SPRING);
        });
      } catch {
        // Motion sensors unavailable — the card still tilts via touch-drag below.
      }
    })();
    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .onBegin(() => {
      // DeviceMotion publishes every 50 ms. Let the finger be the sole source while dragging so
      // the two inputs cannot alternately overwrite the same values and make the card jitter.
      panActive.value = 1;
    })
    .onUpdate((e) => {
      if (!cardWidth.value || !cardHeight.value) return;
      tiltX.value = withSpring(
        Math.min(0.5, Math.max(-0.5, e.x / cardWidth.value - 0.5)),
        CARD_SPRING,
      );
      tiltY.value = withSpring(
        Math.min(0.5, Math.max(-0.5, e.y / cardHeight.value - 0.5)),
        CARD_SPRING,
      );
    })
    .onFinalize(() => {
      tiltX.value = withSpring(0, CARD_SPRING);
      tiltY.value = withSpring(0, CARD_SPRING);
      // Match the web spring's settling window before device orientation takes control again.
      panActive.value = withDelay(650, withTiming(0, { duration: 0 }));
    });

  const onCardLayout = (e: LayoutChangeEvent) => {
    cardWidth.value = e.nativeEvent.layout.width;
    cardHeight.value = e.nativeEvent.layout.height;
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: CARD_PERSPECTIVE },
      { rotateX: `${interpolate(tiltY.value, [-0.5, 0.5], [MAX_TILT_DEG, -MAX_TILT_DEG])}deg` },
      { rotateY: `${interpolate(tiltX.value, [-0.5, 0.5], [-MAX_TILT_DEG, MAX_TILT_DEG])}deg` },
    ],
  }));

  /**
   * Reproduces the web card's layered parallax. There the content sits in a
   * `transform-style: preserve-3d` wrapper and individual blocks are pushed toward the viewer
   * with `translateZ`, so they slide slightly against the card face as it tilts.
   *
   * React Native has no nested 3D scene graph — every view is a flat plane with its own
   * transform, and a child's `translateZ` is simply ignored. The parallax is therefore computed
   * directly instead: rotating a point at depth Z by rotY θ / rotX ψ moves it to
   * (Z·sinθ, −Z·sinψ) on screen. Feeding the same two tilt values the card itself uses reproduces
   * the effect rather than approximating it.
   *
   * The matching P/(P−Z) magnification is deliberately left off. It works out to about 1.03 here,
   * far too little to read as depth, and a scaled sublayer inside the card's own 3D transform is
   * the other half of what iOS renders at reduced resolution.
   */
  const useDepthStyle = (depth: number) =>
    useAnimatedStyle(() => {
      const rotX = (interpolate(tiltY.value, [-0.5, 0.5], [MAX_TILT_DEG, -MAX_TILT_DEG]) * Math.PI) / 180;
      const rotY = (interpolate(tiltX.value, [-0.5, 0.5], [-MAX_TILT_DEG, MAX_TILT_DEG]) * Math.PI) / 180;
      return {
        transform: [
          { translateX: depth * Math.sin(rotY) },
          { translateY: -depth * Math.sin(rotX) },
        ],
      };
    });

  // Scaled up from the web's `translateZ` values of 10/15 in step with the more exaggerated tilt,
  // and because this parallax is now the only thing selling the card's depth to the text — the
  // copy sits outside the 3D subtree so it stays crisp. The chip's own `translateZ(5px)` is still
  // deliberately not reproduced: its parent row is not itself `preserve-3d`, so the browser
  // flattens the chip into the row's plane and it renders at the row's depth, as it does here.
  const headerDepthStyle = useDepthStyle(26);
  const pointsDepthStyle = useDepthStyle(38);

  React.useEffect(() => {
    if (displayPoints === currentPoints) return;
    let raf = 0;
    const startTime = performance.now();
    const duration = 1200;
    const start = displayPoints;
    const end = currentPoints;

    const animate = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplayPoints(Math.floor(start + (end - start) * ease));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPoints]);

  const handleClaim = () => {
    if (claimed) return;
    setParticleIds(Array.from({ length: 12 }, (_, i) => Date.now() + i));
    setClaimed(true);
    setTimeout(() => setCurrentPoints((p) => p + 15), 600);
  };

  return (
    <View className="relative">
      {/* Loyalty Card */}
      <View
        className="relative z-20"
        style={{ paddingHorizontal: 32 * designScale, marginTop: 20 * designScale }}
      >
        <GestureDetector gesture={pan}>
          <View
            onLayout={onCardLayout}
            className="relative w-full"
            style={{
              aspectRatio: 1.586,
              borderRadius: 22 * designScale,
              // Sized to the card itself, never to the padded column around it — an absolutely
              // positioned shadow layer resolves its insets against the parent's *padding* box,
              // so it drew a rounded halo 32pt wider than the card on each side. The base green
              // sits under the gradient so no seam can read as white either.
              backgroundColor: '#00391f',
              boxShadow: '0 20px 25px -5px rgba(20,83,45,0.12), 0 8px 10px -6px rgba(20,83,45,0.12)',
            }}
          >
            {/*
              One tilted layer holding both the artwork and the copy. They have to share a plane:
              when the tilt was applied to the artwork alone, its rotated plane cut through the
              flat text plane in 3D and occluded half the copy on one tilt direction and the other
              half on the opposite one.

              Deliberately carries no `borderRadius`/`overflow` of its own — that mask is what was
              forcing the offscreen, non-Retina composite described above the component. Rounding
              is handled by the wrapper behind it and by the artwork below; the copy sits well
              inside its padding, so nothing here needs clipping.
            */}
            <Animated.View
              style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, cardAnimStyle]}
            >
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
                <LinearGradient
                  colors={['#00753f', '#005c32', '#00391f']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 22 * designScale,
                    overflow: 'hidden',
                  }}
                >
                  <LoyaltyCardTexture />
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: '15.9%',
                      // Web positions the 83%-wide image at left 53.5% and translates it -50%.
                      // Its effective left edge is therefore 53.5% - 41.5% = 12%.
                      left: '12%',
                      width: '83%',
                      height: '71.7%',
                    }}
                  >
                    <FrooMark width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
                  </View>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,34,15,0.6)']}
                    style={{ position: 'absolute', right: 0, bottom: 0, left: 0, height: 100 }}
                  />
                </LinearGradient>
              </View>

              {/* Card content */}
              <View
                className="absolute inset-0 flex-col justify-between"
                style={{ padding: 18 * designScale }}
              >
                <Animated.View
                  style={[
                    headerDepthStyle,
                    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
                  ]}
                >
                <View style={{ gap: 12 * designScale }}>
                  <View className="flex-row items-center" style={{ gap: 6 * designScale }}>
                    <Leaf size={16 * designScale} color="#4ade80" />
                    <Text className="font-bold tracking-widest text-xs uppercase text-green-50">
                      Froo<Text className="text-green-400">Rewards</Text>
                    </Text>
                  </View>
                  <LinearGradient
                    colors={['#fef08a', 'rgba(234,179,8,0.8)']}
                    style={{
                      width: 40 * designScale,
                      height: 28 * designScale,
                      borderRadius: 4 * designScale,
                      justifyContent: 'space-evenly',
                      paddingHorizontal: 6 * designScale,
                      borderWidth: 1,
                      borderColor: 'rgba(253,224,71,0.5)',
                    }}
                  >
                    <View className="w-full h-[1px] bg-yellow-700/30" />
                    <View className="w-full h-[1px] bg-yellow-700/30" />
                    <View className="w-full h-[1px] bg-yellow-700/30" />
                  </LinearGradient>
                </View>

                <AppPressable
                  onPress={() => setShowQR(true)}
                  className="border border-white/20 overflow-hidden"
                  style={{
                    padding: 10 * designScale,
                    borderRadius: 14 * designScale,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <View style={{ zIndex: 1 }}>
                    <QrCode size={24 * designScale} color="white" />
                  </View>
                </AppPressable>
              </Animated.View>

              <Animated.View style={pointsDepthStyle} className="mt-auto pt-2">
                <View className="flex-row justify-between items-end mb-3">
                  <View>
                    <Text className="text-[10px] uppercase tracking-widest text-green-50/90 mb-1 font-bold">Points Balance</Text>
                    <Text className="text-3xl font-black text-white leading-none">
                      {displayPoints.toLocaleString()} <Text className="text-sm font-bold text-green-300">pts</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] uppercase tracking-widest text-green-50/90 mb-1 font-bold">Member</Text>
                    <Text className="text-sm font-bold tracking-wider text-white">Necula David</Text>
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-4 h-4 rounded-full bg-yellow-400 items-center justify-center">
                        <Award size={10} color="#a16207" />
                      </View>
                      <Text className="text-xs font-bold tracking-wider text-yellow-400">GOLD</Text>
                    </View>
                    <Text className="text-[9px] font-bold uppercase tracking-widest text-green-50">Platinum</Text>
                  </View>
                  <View className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <LinearGradient colors={['#eab308', '#fde047']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: '60%', height: '100%' }} />
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[9px] text-green-50/90 font-semibold">1,180 pts to Platinum</Text>
                    <Text className="text-[9px] text-green-50/90 font-semibold tracking-widest">EXP 04/28</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
            </Animated.View>
          </View>
        </GestureDetector>
      </View>

      {/* Quick Actions */}
      <View className="px-8 mt-5">
        <View
          className="bg-white rounded-[32px] p-5 border border-slate-100 flex-row justify-around"
          style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}
        >
          <ActionBtn icon={Gift} label="Redeem" onClick={() => setShowRewards(true)} />
          <ActionBtn icon={MapPin} label="Stores" onClick={() => setActiveTab('stores')} />
          <ActionBtn icon={Clock} label="History" onClick={() => setShowHistory(true)} />
        </View>
      </View>

      {/* Mascot floating overlay */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 269 * designScale,
          left: '79.4%',
          width: '32.6%',
          aspectRatio: 0.6388,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-21.4deg' }],
          zIndex: 20,
        }}
      >
        <ExpoImage
          source={mascotFloatImg}
          contentFit="contain"
          // Decoded off the JS thread and kept in the memory/disk cache, so the mascot is present
          // on the first frame of every later visit instead of popping in once RN's own Image has
          // finished decoding it. `transition={0}` because any fade here only delays that.
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          // Give native both dimensions from the already-sized wrapper. A percentage width plus
          // inferred aspectRatio can fall back to the PNG's intrinsic bitmap dimensions during
          // Android's first layout pass, which makes the mascot cover the screen.
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Daily Streak */}
      <View style={{ paddingHorizontal: 32 * designScale, marginTop: 13 * designScale }}>
        <View
          className="bg-white border border-slate-100 relative overflow-hidden"
          style={{
            height: 179 * designScale,
            padding: 20 * designScale,
            borderRadius: 32 * designScale,
            boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
          }}
        >
          <AppPressable
            onPress={handleClaim}
            disabled={claimed}
            // Only the top-right/bottom-left corners are rounded (a deliberate cut into the
            // card's own corner) — iOS builds a shadow's silhouette from the layer's rectangular
            // bounds, not this asymmetric mask, so the shadow kept the two square corners the
            // mask cuts away, showing as a stray light margin. Fine on the solid orange CTA
            // (reads as a warm glow), but on the near-white claimed pill it just looked broken,
            // so it's dropped once claimed instead of trying to reshape it to match.
            className={`absolute top-0 right-0 z-30 items-center justify-center ${
              claimed ? 'bg-slate-50' : 'bg-[#F29F05] shadow-md shadow-orange-200/70'
            }`}
            style={{
              height: 46 * designScale,
              minWidth: 138 * designScale,
              borderTopRightRadius: 32 * designScale,
              borderBottomLeftRadius: 26 * designScale,
              paddingHorizontal: 20 * designScale,
            }}
          >
            {claimed ? (
              <View className="flex-row items-center gap-1">
                <Check size={16} color="#16a34a" />
                <Text className="text-green-600 text-base font-black">Claimed</Text>
              </View>
            ) : (
              <Text className="text-white text-base font-black">Claim +15</Text>
            )}
          </AppPressable>

          <View style={{ paddingRight: 112 * designScale }}>
            <View className="flex-row items-center" style={{ gap: 8 * designScale }}>
              <Flame size={20 * designScale} color="#f97316" />
              <Text className="font-bold text-lg text-slate-800">Daily Streak</Text>
            </View>
            {claimed ? (
              <View
                className="relative"
                style={{ marginTop: 4 * designScale, height: 16 * designScale }}
              >
                  <Text className="text-xs text-slate-500 font-medium">3 Day Streak!</Text>
                  <View
                    className="flex-row items-center bg-orange-100"
                    style={{
                      position: 'absolute',
                      left: 78 * designScale,
                      top: 0,
                      gap: 3 * designScale,
                      paddingHorizontal: 4 * designScale,
                      paddingVertical: 2 * designScale,
                      borderRadius: 4 * designScale,
                    }}
                  >
                    <Crown size={10 * designScale} color="#ea580c" />
                    <Text
                      className="text-orange-600 uppercase font-bold"
                      style={{
                        fontSize: 9 * designScale,
                        lineHeight: 12 * designScale,
                        letterSpacing: 0.9 * designScale,
                      }}
                    >
                      Bonus Unlocked
                    </Text>
                  </View>
              </View>
            ) : (
              <View
                className="flex-row items-center flex-wrap"
                style={{ marginTop: 4 * designScale, gap: 6 * designScale }}
              >
                <Text className="text-xs text-slate-500 font-medium">2 Day Streak! +15 pts today</Text>
              </View>
            )}
          </View>

          <View
            className="flex-row justify-between items-center relative"
            style={{ marginTop: 12 * designScale }}
          >
            <View
              className="absolute top-1/2 -translate-y-1/2 bg-slate-100 -z-10 rounded-full"
              style={{ left: 16 * designScale, right: 16 * designScale, height: 2 * designScale }}
            />
            {STREAK_DAYS.map((d, i) => {
              const isChecked = d.checked || (d.current && claimed);
              return (
                <View key={i} className="items-center bg-white" style={{ gap: 6 * designScale }}>
                  <Text className={`text-[10px] font-bold uppercase ${d.current ? (claimed ? 'text-green-500' : 'text-orange-500') : 'text-slate-400'}`}>
                    {d.day}
                  </Text>
                  <View
                    className={`items-center justify-center ${
                      d.current && !claimed ? 'ring-4 ring-orange-50' : ''
                    } ${isChecked ? 'bg-[#78C043]' : 'bg-slate-50 border border-slate-200'}`}
                    style={{
                      width: 32 * designScale,
                      height: 32 * designScale,
                      borderRadius: 16 * designScale,
                    }}
                  >
                    {isChecked ? (
                      <FrogHandIcon width={20 * designScale} height={(20 / 1.314) * designScale} />
                    ) : (
                      <Leaf size={16 * designScale} color="#cbd5e1" />
                    )}
                  </View>
                  <Text className={`text-[9px] font-black ${isChecked ? 'text-green-600' : 'text-slate-400'}`}>{d.pts}</Text>
                </View>
              );
            })}
          </View>
        </View>
        {particleIds.map((id) => (
          <Particle
            key={id}
            designScale={designScale}
            onDone={() => setParticleIds((prev) => prev.filter((p) => p !== id))}
          />
        ))}
      </View>

      {/* Promotional Games */}
      <View style={{ paddingHorizontal: 32 * designScale, marginTop: 32 * designScale }}>
        <AppPressable
          onPress={() => setShowPersonalGame(true)}
          className="bg-white shadow-sm border border-slate-100 relative overflow-hidden"
          style={{ padding: 24 * designScale, borderRadius: 32 * designScale }}
        >
          <GamesCardTexture />

          <View className="flex-row justify-between items-center w-full relative z-10">
            <View className="flex-row items-center" style={{ gap: 16 * designScale }}>
              <LinearGradient
                colors={['#22c55e', '#059669']}
                style={{
                  width: 48 * designScale,
                  height: 48 * designScale,
                  borderRadius: 18 * designScale,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <FrooGamesBg width="100%" height="100%" />
              </LinearGradient>
              <View>
                <View className="flex-row items-center" style={{ gap: 8 * designScale }}>
                  <Text
                    className="font-bold text-slate-800"
                    style={{ fontSize: 18 * designScale, lineHeight: 22.5 * designScale }}
                  >
                    Froo Games
                  </Text>
                  <View
                    className="bg-green-100"
                    style={{
                      paddingHorizontal: 8 * designScale,
                      paddingVertical: 2 * designScale,
                      borderRadius: 6 * designScale,
                    }}
                  >
                    <Text
                      className="text-green-700 font-bold uppercase"
                      style={{
                        fontSize: 9 * designScale,
                        lineHeight: 12 * designScale,
                        letterSpacing: 0.9 * designScale,
                      }}
                    >
                      Live
                    </Text>
                  </View>
                </View>
                <Text
                  className="font-medium text-slate-500"
                  style={{
                    marginTop: 4 * designScale,
                    fontSize: 12 * designScale,
                    lineHeight: 16 * designScale,
                  }}
                >
                  Top the weekly leaderboard!
                </Text>
              </View>
            </View>
            <View
              className="bg-slate-50 border border-slate-100"
              style={{ padding: 8 * designScale, borderRadius: 12 * designScale }}
            >
              <ChevronRight size={20 * designScale} color="#94a3b8" />
            </View>
          </View>
        </AppPressable>
      </View>

      {/* Weekly Offers */}
      <View style={{ paddingHorizontal: 24 * designScale, marginTop: 32 * designScale }}>
        <View
          className="flex-row justify-between items-center"
          style={{ marginBottom: 16 * designScale }}
        >
          <Text
            className="font-bold text-slate-800"
            style={{ fontSize: 18 * designScale, lineHeight: 28 * designScale }}
          >
            Weekly Offers
          </Text>
          <AppPressable onPress={() => setActiveTab('coupons')}>
            <Text
              className="text-green-600 underline font-semibold"
              style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}
            >
              View All
            </Text>
          </AppPressable>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 16 * designScale }}>
          {OFFERS.slice(0, 2).map((offer, i) => (
            <View
              key={offer.id}
              style={{
                width: '46%',
                flexGrow: 1,
                padding: 20 * designScale,
                borderRadius: 24 * designScale,
                gap: 12 * designScale,
              }}
              className={`border shadow-sm ${i === 0 ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}
            >
              <View
                className={`items-center justify-center ${i === 0 ? 'bg-white' : 'bg-green-100'}`}
                style={{
                  width: 48 * designScale,
                  height: 48 * designScale,
                  borderRadius: 16 * designScale,
                }}
              >
                <offer.icon size={24 * designScale} color={i === 0 ? '#16a34a' : '#15803d'} />
              </View>
              <View>
                <Text
                  className="font-bold text-slate-800 uppercase"
                  style={{
                    fontSize: 10 * designScale,
                    lineHeight: 15 * designScale,
                    letterSpacing: 0.25 * designScale,
                  }}
                >
                  {offer.title}
                </Text>
                <Text
                  className="text-slate-600"
                  style={{
                    marginTop: 4 * designScale,
                    fontSize: 12 * designScale,
                    lineHeight: 16 * designScale,
                  }}
                >
                  {offer.desc}
                </Text>
                <Text
                  className={`font-bold ${i === 0 ? 'text-green-700' : 'text-slate-400'}`}
                  style={{
                    marginTop: 8 * designScale,
                    fontSize: 10 * designScale,
                    lineHeight: 15 * designScale,
                  }}
                >
                  Exp: Nov 30
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View
        style={{
          paddingHorizontal: 24 * designScale,
          marginTop: 32 * designScale,
          marginBottom: 24 * designScale,
        }}
      >
        <View
          className="bg-white shadow-sm border border-slate-100"
          style={{ borderRadius: 24 * designScale, padding: 24 * designScale }}
        >
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: 20 * designScale }}
          >
            <Text
              className="font-bold text-slate-800"
              style={{ fontSize: 14 * designScale, lineHeight: 20 * designScale }}
            >
              Recent Savings
            </Text>
            <AppPressable onPress={() => setShowHistory(true)}>
              <Text
                className="text-green-600 underline font-semibold"
                style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}
              >
                View All
              </Text>
            </AppPressable>
          </View>
          <View style={{ gap: 16 * designScale }}>
            {TRANSACTIONS.slice(0, 2).map((tx) => (
              <View key={tx.id} className="flex-row justify-between items-center">
                <View className="flex-row items-center" style={{ gap: 12 * designScale }}>
                  <View
                    className="bg-slate-50 border border-slate-100 items-center justify-center"
                    style={{
                      width: 40 * designScale,
                      height: 40 * designScale,
                      borderRadius: 12 * designScale,
                    }}
                  >
                    <ShoppingBag size={20 * designScale} color="#94a3b8" />
                  </View>
                  <View>
                    <Text
                      className="font-bold text-slate-700"
                      style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}
                    >
                      {tx.store}
                    </Text>
                    <Text
                      className="text-slate-400"
                      style={{
                        marginTop: 2 * designScale,
                        fontSize: 10 * designScale,
                        lineHeight: 15 * designScale,
                      }}
                    >
                      {tx.date}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className="font-bold text-green-600"
                    style={{ fontSize: 14 * designScale, lineHeight: 20 * designScale }}
                  >
                    {tx.amount}
                  </Text>
                  <Text
                    className="font-bold text-slate-400"
                    style={{
                      marginTop: 2 * designScale,
                      fontSize: 10 * designScale,
                      lineHeight: 15 * designScale,
                    }}
                  >
                    {tx.points} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
