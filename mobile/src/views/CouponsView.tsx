import React from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { ChevronRight, Coffee, Gift, X } from 'lucide-react-native';
import { OFFERS } from '../data/mockData';
import { imageSource, isCutout, type ImageRef } from '../theme/image';
import { RARITY_COLORS } from '../data/extractionPrizes';
import { useAppContext } from '../context/AppContext';
import { AppPressable } from '../components/AppPressable';
import { BackdropBlur } from '../components/BackdropBlur';
import type { Offer } from '../types';
import { SheetGrabber } from '../components/SheetGrabber';
import { elevation, glow } from '../theme/elevation';
/**
 * The offer photo tucked into the card's top-right corner.
 *
 * Web reference:
 *   `h-24 w-28 rounded-bl-[30px]` + `clipPath: polygon(28% 0, 100% 0, 100% 100%, 0 100%)`
 *   with a `bg-gradient-to-bl from-black/5 to-white/20` sheen over it.
 *
 * React Native has no `clip-path`, so the same outline is drawn as an SVG path and used as a
 * real clip: across the top edge from 28%, down the right, then a 30px arc into the rounded
 * bottom-left corner and back up the diagonal. `slice` reproduces `object-cover`.
 */
const CORNER_W = 112; // w-28
const CORNER_H = 96; // h-24
const CORNER_R = 30; // rounded-bl-[30px]
const CORNER_PATH = [
  `M ${CORNER_W * 0.28} 0`,
  `L ${CORNER_W} 0`,
  `L ${CORNER_W} ${CORNER_H}`,
  `L ${CORNER_R} ${CORNER_H}`,
  `A ${CORNER_R} ${CORNER_R} 0 0 1 0 ${CORNER_H - CORNER_R}`,
  'Z',
].join(' ');

function CouponImageCorner({ image, id, designScale }: { image: ImageRef; id: number | string; designScale: number }) {
  const cutout = isCutout(image);
  // Ids are referenced by `url(#…)` within this <Svg>; keying them per offer keeps sibling
  // cards from resolving each other's defs.
  const clipId = `couponClip-${id}`;
  const sheenId = `couponSheen-${id}`;

  return (
    <Svg
      width={CORNER_W * designScale}
      height={CORNER_H * designScale}
      viewBox={`0 0 ${CORNER_W} ${CORNER_H}`}
      style={{ position: 'absolute', right: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <ClipPath id={clipId}>
          <Path d={CORNER_PATH} />
        </ClipPath>
        {/* `to-bl` runs from the top-right corner to the bottom-left. */}
        <SvgLinearGradient id={sheenId} x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity={0.05} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.2} />
        </SvgLinearGradient>
      </Defs>
      {cutout ? (
        // Bistro photos are transparent cut-outs: sit them on a warm plate instead of cropping.
        <>
          <Path d={CORNER_PATH} fill="#fbf3e8" />
          <SvgImage
            href={image}
            x={CORNER_W * 0.2}
            y={6}
            width={CORNER_W * 0.78}
            height={CORNER_H - 12}
            preserveAspectRatio="xMidYMid meet"
            clipPath={`url(#${clipId})`}
          />
        </>
      ) : (
        <SvgImage
          href={imageSource(image)}
          width={CORNER_W}
          height={CORNER_H}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      )}
      <Rect
        width={CORNER_W}
        height={CORNER_H}
        fill={`url(#${sheenId})`}
        clipPath={`url(#${clipId})`}
      />
    </Svg>
  );
}

const FEATURED_BAKERY_COUPON: Offer = {
  id: 99,
  title: 'Bakery',
  desc: '15% off all Artisan Breads',
  icon: Coffee,
  discount: '15% OFF',
  color: 'bg-amber-50 text-amber-600',
  image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=500',
};

const COUPONS = [...OFFERS, FEATURED_BAKERY_COUPON];
const CATEGORIES = ['All Offers', ...Array.from(new Set(COUPONS.map((coupon) => coupon.title)))];

const COUPON_ACCENTS: Record<string, string> = {
  'Froo Bistro': 'bg-orange-500 shadow-orange-100',
  'Dairy & Eggs': 'bg-emerald-600 shadow-emerald-100',
  'Fresh Produce': 'bg-[#006320] shadow-green-100',
  Bakery: 'bg-amber-500 shadow-amber-100',
  'Meat & Seafood': 'bg-rose-500 shadow-rose-100',
};

function getCouponAccent(title: string) {
  return COUPON_ACCENTS[title] ?? 'bg-slate-800';
}

function CategoryFilter({
  category,
  isActive,
  designScale,
  onSelect,
}: {
  category: string;
  isActive: boolean;
  designScale: number;
  onSelect: () => void;
}) {
  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onSelect}
      onPressIn={onSelect}
      style={{
        backgroundColor: isActive ? '#006320' : '#ffffff',
        boxShadow: isActive ? 'none' : '0 1px 2px rgba(15,23,42,0.05)',
        paddingHorizontal: 20 * designScale,
        paddingVertical: 8 * designScale,
        borderRadius: 12 * designScale,
      }}
    >
      <Text
        className="font-bold uppercase"
        style={{
          color: isActive ? '#ffffff' : '#475569',
          fontSize: 10 * designScale,
          lineHeight: 15 * designScale,
          letterSpacing: 0.5 * designScale,
        }}
      >
        {category}
      </Text>
    </AppPressable>
  );
}

function ScanLine({ designScale }: { designScale: number }) {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 2 * designScale,
          zIndex: 10,
          backgroundColor: '#ef4444',
          boxShadow: '0 0 8px rgba(239,68,68,0.8)',
        },
        style,
      ]}
    />
  );
}

interface CouponRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function CouponDetailModal({ coupon, origin, onClose }: { coupon: Offer; origin: CouponRect; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const designScale = width / 425;
  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isMorphClosing = useSharedValue(0);
  // On the locked Galaxy the Modal window continues beneath the comparison crop into Android's
  // system-navigation region. A 615dp sheet places its visible top at the web sheet's y=195 while
  // the contents themselves still use the canonical 425px -> native-width scale.
  const sheetHeight = Math.min(615, height * 0.9);
  const sheetTop = height - sheetHeight;

  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
    backdropOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }, [backdropOpacity, progress]);

  const close = React.useCallback(() => {
    isMorphClosing.value = 1;
    backdropOpacity.value = withTiming(0, {
      duration: 230,
      easing: Easing.bezier(0.32, 0, 0.67, 0),
    });
    progress.value = withTiming(
      0,
      { duration: 230, easing: Easing.bezier(0.32, 0, 0.67, 0) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }, [backdropOpacity, isMorphClosing, onClose, progress]);

  // Pull-to-dismiss from anywhere on the sheet while its content is scrolled to the top (iOS
  // sheet behaviour); once the content is scrolled, the same drag just scrolls it.
  const scrollY = useSharedValue(0);
  const contentDragging = useSharedValue(false);
  const anchorY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const finishDrag = React.useCallback(
    (velocityY: number) => {
      'worklet';
      if (dragY.value > sheetHeight * 0.2 || velocityY > 850) {
        // A drag-dismiss is a slide, not a second card morph. Morphing toward the source card
        // while also translating down compounded two exits and caused the visible close glitch.
        backdropOpacity.value = withTiming(0, {
          duration: 210,
          easing: Easing.bezier(0.32, 0, 0.67, 0),
        });
        dragY.value = withTiming(
          sheetHeight,
          { duration: 210, easing: Easing.bezier(0.32, 0, 0.67, 0) },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
        return;
      }
      dragY.value = withSpring(0, {
        damping: 32,
        stiffness: 320,
        mass: 0.75,
        overshootClamping: true,
        energyThreshold: 0.001,
      });
    },
    [backdropOpacity, dragY, onClose, sheetHeight],
  );

  const sheetGesture = React.useMemo(() => {
    const nativeScroll = Gesture.Native();
    const pan = Gesture.Pan()
      .maxPointers(1)
      .activeOffsetY([-6, 6])
      .failOffsetX([-24, 24])
      .onStart(() => {
        contentDragging.value = false;
      })
      .onUpdate((event) => {
        if (!contentDragging.value) {
          if (scrollY.value > 1 || event.translationY <= 0) return;
          contentDragging.value = true;
          anchorY.value = event.translationY;
          cancelAnimation(dragY);
        }
        const next = event.translationY - anchorY.value;
        dragY.value = next < 0 ? 0 : next;
      })
      .onEnd((event) => {
        if (!contentDragging.value) return;
        contentDragging.value = false;
        finishDrag(event.velocityY);
      })
      .onFinalize(() => {
        if (!contentDragging.value) return;
        contentDragging.value = false;
        finishDrag(0);
      });
    return Gesture.Simultaneous(pan, nativeScroll);
  }, [anchorY, contentDragging, dragY, finishDrag, scrollY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    // Hand off to the real source card just before the UI-thread animation completes. Without
    // this tiny threshold, runOnJS can leave one blank origin-sized shell visible for a frame.
    opacity: interpolate(progress.value, [0, 0.03, 1], [0, 1, 1]),
    left: interpolate(progress.value, [0, 1], [origin.x, 0]),
    top: interpolate(progress.value, [0, 1], [origin.y, sheetTop]),
    width: interpolate(progress.value, [0, 1], [origin.width, width]),
    height: interpolate(progress.value, [0, 1], [origin.height, sheetHeight]),
    borderTopLeftRadius: interpolate(progress.value, [0, 1], [24 * designScale, 32 * designScale]),
    borderTopRightRadius: interpolate(progress.value, [0, 1], [24 * designScale, 32 * designScale]),
    borderBottomLeftRadius: interpolate(progress.value, [0, 1], [24 * designScale, 0]),
    borderBottomRightRadius: interpolate(progress.value, [0, 1], [24 * designScale, 0]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    // Entrance keeps the approved delayed reveal. On reverse morph, retain a faint trace through
    // the full journey so the shell never becomes an empty white card before it reaches origin.
    opacity: isMorphClosing.value
      ? progress.value
      : interpolate(progress.value, [0, 0.35, 1], [0, 0, 1]),
  }));
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));

  return (
    <Modal transparent visible onRequestClose={close} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, zIndex: 50 }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropStyle]}>
          <BackdropBlur />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.4)' }]} />
        </Animated.View>
        <AppPressable onPress={close} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[sheetStyle, dragStyle, {
            padding: 32 * designScale,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
          }]}
        >
          <Animated.View style={[{ flex: 1 }, contentStyle]}>
          <GestureDetector gesture={sheetGesture}>
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
          >
              <View style={{ width: '100%', alignItems: 'center', paddingBottom: 18 * designScale }}>
                <View
                  style={{ alignSelf: 'center', marginBottom: 6 * designScale }}
                >
                  <SheetGrabber scale={designScale} />
                </View>
              </View>
            <View className="flex-row justify-between items-start" style={{ marginBottom: 24 * designScale }}>
            <View className="flex-row items-center flex-1" style={{ gap: 16 * designScale }}>
              {coupon.image ? (
                <ExpoImage
                  source={imageSource(coupon.image)}
                  style={{ width: 64 * designScale, height: 64 * designScale, borderRadius: 16 * designScale, backgroundColor: isCutout(coupon.image) ? '#fbf3e8' : undefined }}
                  contentFit={isCutout(coupon.image) ? 'contain' : 'cover'}
                />
              ) : (
                <View
                  className={`items-center justify-center ${getCouponAccent(coupon.title)}`}
                  style={{ width: 56 * designScale, height: 56 * designScale, borderRadius: 16 * designScale }}
                >
                  <coupon.icon size={24 * designScale} color="white" />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="font-bold text-slate-800 uppercase"
                  style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 0.25 * designScale }}
                >
                  {coupon.title}
                </Text>
                <Text
                  className="font-bold text-slate-800"
                  style={{ marginTop: 4 * designScale, fontSize: 17 * designScale, lineHeight: 22.5 * designScale }}
                >
                  {coupon.desc}
                </Text>
              </View>
            </View>
            <AppPressable
              onPress={close}
              className="bg-slate-50 items-center justify-center"
              style={{ width: 40 * designScale, height: 40 * designScale, borderRadius: 20 * designScale }}
            >
              <X size={20 * designScale} color="#64748b" />
            </AppPressable>
          </View>

          <View
            className="bg-slate-50 items-center w-full relative overflow-hidden"
            style={[elevation.well, {
              height: 206 * designScale,
              padding: 24 * designScale,
              borderRadius: 24 * designScale,
              marginBottom: 24 * designScale,
            }]}
          >
            <View
              className="absolute top-0 right-0 bg-green-100"
              style={{ paddingHorizontal: 12 * designScale, paddingVertical: 4 * designScale, borderBottomLeftRadius: 12 * designScale }}
            >
              <Text
                className="text-green-700 font-bold uppercase"
                style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 0.5 * designScale }}
              >
                {coupon.discount}
              </Text>
            </View>
            <Text
              className="font-bold text-slate-400 uppercase"
              style={{ marginBottom: 16 * designScale, fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 1 * designScale }}
            >
              Scan at Register
            </Text>

            <View
              className="w-full bg-white items-center justify-between relative overflow-hidden flex-row"
              style={{ height: 96 * designScale, borderRadius: 12 * designScale, paddingHorizontal: 16 * designScale }}
            >
              <ScanLine designScale={designScale} />
              {[1, 3, 1, 0.5, 4, 2, 1.5, 2, 1, 3, 1, 2, 1, 2, 4, 1, 2, 1].map((w, i) => (
                <View key={i} style={{ width: w * 4 * designScale, height: 64 * designScale }} className="bg-slate-800" />
              ))}
            </View>
            <Text
              className="font-mono font-bold text-slate-400"
              style={{ marginTop: 12 * designScale, fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 1 * designScale }}
            >
              CPN-2026-{coupon.id}9
            </Text>
          </View>

          <View style={{ gap: 16 * designScale, marginBottom: 24 * designScale }}>
            <View>
              <Text
                className="font-bold text-slate-800 uppercase"
                style={{ marginBottom: 8 * designScale, fontSize: 12 * designScale, lineHeight: 16 * designScale, letterSpacing: 0.6 * designScale }}
              >
                How to Use
              </Text>
              <View style={{ gap: 8 * designScale }}>
                <View className="flex-row items-start" style={{ gap: 8 * designScale }}>
                  <View
                    className="bg-green-50 items-center justify-center"
                    style={{ width: 20 * designScale, height: 20 * designScale, borderRadius: 10 * designScale, marginTop: 2 * designScale }}
                  >
                    <Text className="font-bold text-green-600" style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale }}>1</Text>
                  </View>
                  <Text className="text-slate-600 flex-1" style={{ fontSize: 12.5 * designScale, lineHeight: 20 * designScale }}>
                    Add qualifying items to your shopping cart or basket.
                  </Text>
                </View>
                <View className="flex-row items-start" style={{ gap: 8 * designScale }}>
                  <View
                    className="bg-green-50 items-center justify-center"
                    style={{ width: 20 * designScale, height: 20 * designScale, borderRadius: 10 * designScale, marginTop: 2 * designScale }}
                  >
                    <Text className="font-bold text-green-600" style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale }}>2</Text>
                  </View>
                  <Text className="text-slate-600 flex-1" style={{ fontSize: 12.5 * designScale, lineHeight: 20 * designScale }}>
                    Present this barcode to the cashier or scan it at self-checkout.
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ paddingTop: 16 * designScale }}>
              <Text
                className="font-bold text-slate-800 uppercase"
                style={{ marginBottom: 8 * designScale, fontSize: 12 * designScale, lineHeight: 16 * designScale, letterSpacing: 0.6 * designScale }}
              >
                Terms &amp; Conditions
              </Text>
              <Text className="text-slate-500" style={{ fontSize: 9 * designScale, lineHeight: 16.25 * designScale }}>
                Offer valid until Nov 30, 2026. Limit one coupon per customer per visit. Cannot be combined with other offers or store promotions. Discount applies to regular priced items only. Excludes alcohol, tobacco, and gift cards. Valid at all participating froo stores.
              </Text>
            </View>
          </View>
          </Animated.ScrollView>
          </GestureDetector>
          </Animated.View>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function CouponsView() {
  const { width: windowWidth } = useWindowDimensions();
  const designScale = windowWidth / 425;
  const { setShowRewards, wonPrizes, redeemedItems, setActivePromotionItem, activatePrize } = useAppContext();
  const [selectedCoupon, setSelectedCoupon] = React.useState<Offer | null>(null);
  const [transitionOrigin, setTransitionOrigin] = React.useState<CouponRect | null>(null);
  const couponRefs = React.useRef<Record<number, View | null>>({});
  const pendingCategoryTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryScrollX = React.useRef(0);
  const [activeCategory, setActiveCategory] = React.useState('All Offers');
  const visibleCoupons = activeCategory === 'All Offers' ? COUPONS : COUPONS.filter((c) => c.title === activeCategory);

  const scheduleCategorySelection = React.useCallback((category: string) => {
    if (pendingCategoryTimer.current) clearTimeout(pendingCategoryTimer.current);
    const startScrollX = categoryScrollX.current;
    pendingCategoryTimer.current = setTimeout(() => {
      pendingCategoryTimer.current = null;
      if (Math.abs(categoryScrollX.current - startScrollX) < 3) {
        setActiveCategory(category);
      }
    }, 100);
  }, []);

  React.useEffect(() => () => {
    if (pendingCategoryTimer.current) clearTimeout(pendingCategoryTimer.current);
  }, []);

  return (
    <View style={{ padding: 24 * designScale }}>
      <Text
        className="font-bold text-slate-800"
        style={{ marginBottom: 24 * designScale, fontSize: 20 * designScale, lineHeight: 28 * designScale }}
      >
        Offers &amp; Rewards
      </Text>

      <AppPressable
        onPress={() => setShowRewards(true)}
        className="flex-row items-center justify-between bg-[#006320]"
        style={[glow('0, 99, 32'), { padding: 20 * designScale, marginBottom: 32 * designScale, borderRadius: 24 * designScale }]}
      >
        <View className="flex-row items-center" style={{ gap: 16 * designScale }}>
          <View
            className="bg-white/20 items-center justify-center"
            style={{
              width: 48 * designScale,
              height: 48 * designScale,
              borderRadius: 12 * designScale,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
            }}
          >
            <Gift size={24 * designScale} color="white" />
          </View>
          <View>
            <Text
              className="font-bold uppercase text-green-100"
              style={{
                marginBottom: 2 * designScale,
                fontSize: 10 * designScale,
                lineHeight: 15 * designScale,
                letterSpacing: 1 * designScale,
              }}
            >
              FrooRewards
            </Text>
            <Text className="font-bold text-white" style={{ fontSize: 18 * designScale, lineHeight: 22.5 * designScale }}>
              Redeem Points
            </Text>
          </View>
        </View>
        <View
          className="bg-white/20 items-center justify-center"
          style={[elevation.card, { width: 40 * designScale, height: 40 * designScale, borderRadius: 20 * designScale }]}
        >
          <ChevronRight size={20 * designScale} color="white" />
        </View>
      </AppPressable>

      {wonPrizes.length > 0 ? (
        <View style={{ marginBottom: 32 * designScale, gap: 16 * designScale }}>
          <Text
            className="font-bold text-slate-800"
            style={{ fontSize: 14 * designScale, lineHeight: 20 * designScale }}
          >
            Rewards
          </Text>
          {wonPrizes.map((won) => {
            const isProduct = won.prize.kind === 'product';
            const rarityColor = RARITY_COLORS[won.prize.rarity];
            const redemption = isProduct ? redeemedItems[won.prize.name] : undefined;
            const isActivated = !!won.activatedAt;
            const isLive = isActivated && (redemption?.expiry ?? 0) > Date.now();
            const isExpired = isActivated && !isLive;
            const hasImage = isProduct && !!won.prize.image;

            return (
              <View
                key={won.id}
                className="relative bg-white overflow-hidden"
                style={[elevation.card, { padding: 20 * designScale, borderRadius: 24 * designScale, gap: 16 * designScale }]}
              >
                {hasImage && won.prize.image !== undefined && <CouponImageCorner image={won.prize.image} id={won.id} designScale={designScale} />}
                <View className="flex-row items-center" style={{ gap: 16 * designScale, paddingRight: hasImage ? 96 * designScale : 0 }}>
                  {!hasImage && (
                    <View
                      className="items-center justify-center"
                      style={[elevation.card, { width: 56 * designScale, height: 56 * designScale, borderRadius: 16 * designScale, backgroundColor: rarityColor }]}
                    >
                      <Gift size={24 * designScale} strokeWidth={2.4} color="white" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="font-bold uppercase"
                      style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 0.6 * designScale, color: rarityColor }}
                    >
                      {won.prize.rarity} prize drop
                    </Text>
                    <Text
                      className="font-bold text-slate-800"
                      style={{ marginTop: 2 * designScale, fontSize: 14 * designScale, lineHeight: 20 * designScale }}
                    >
                      {won.prize.kind === 'points' ? `+${won.prize.pointsValue} Points` : won.prize.name}
                    </Text>
                    <Text
                      className="font-bold text-slate-400"
                      style={{ marginTop: 4 * designScale, fontSize: 10 * designScale, lineHeight: 15 * designScale }}
                    >
                      {won.prize.kind === 'points'
                        ? 'Added to your balance'
                        : isExpired
                          ? 'Redemption window expired'
                          : isLive
                            ? 'Use in-store within 15 min'
                            : 'Ready to activate — start when you’re heading to the store'}
                    </Text>
                  </View>
                </View>

                {isProduct && !isExpired ? (
                  <AppPressable
                    onPress={() => (isLive ? setActivePromotionItem(redemption!.item) : activatePrize(won.id))}
                    className={`w-full items-center ${isLive ? 'bg-slate-50' : 'bg-green-600'}`}
                    style={[elevation.card, { paddingVertical: 12 * designScale, borderRadius: 12 * designScale }]}
                  >
                    <Text
                      className={`font-bold ${isLive ? 'text-green-700' : 'text-white'}`}
                      style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}
                    >
                      {isLive ? 'View QR Code' : 'Activate Reward'}
                    </Text>
                  </AppPressable>
                ) : null}
                {isExpired ? (
                  <View className="w-full bg-slate-50 items-center" style={[elevation.card, { paddingVertical: 12 * designScale, borderRadius: 12 * designScale }]}>
                    <Text className="text-slate-400 font-bold" style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}>Expired</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <Text
        className="font-bold text-slate-800"
        style={{ marginBottom: 16 * designScale, fontSize: 14 * designScale, lineHeight: 20 * designScale }}
      >
        Digital Coupons
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          categoryScrollX.current = event.nativeEvent.contentOffset.x;
        }}
        contentContainerStyle={{ gap: 12 * designScale, paddingBottom: 16 * designScale }}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <CategoryFilter
              key={category}
              category={category}
              isActive={isActive}
              designScale={designScale}
              onSelect={() => scheduleCategorySelection(category)}
            />
          );
        })}
      </ScrollView>

      <View style={{ gap: 16 * designScale, marginTop: 8 * designScale }}>
        {visibleCoupons.map((offer, index) => (
          <Animated.View
            ref={(node) => { couponRefs.current[offer.id] = node as View | null; }}
            key={offer.id}
            entering={FadeInDown.duration(400).delay(index * 100).withInitialValues({ opacity: 0, transform: [{ translateY: 10 * designScale }] })}
            layout={LinearTransition.springify().damping(18).stiffness(180).mass(0.7)}
          >
          <View
            className="relative bg-white overflow-hidden"
            style={[elevation.card, { padding: 20 * designScale, borderRadius: 24 * designScale, gap: 16 * designScale }]}
          >
            {offer.image !== undefined && <CouponImageCorner image={offer.image} id={offer.id} designScale={designScale} />}
            <View className="flex-row items-center" style={{ gap: 16 * designScale, paddingRight: 96 * designScale }}>
              <View
                className={`items-center justify-center ${getCouponAccent(offer.title)}`}
                style={[elevation.card, { width: 56 * designScale, height: 56 * designScale, borderRadius: 16 * designScale }]}
              >
                <offer.icon size={24 * designScale} strokeWidth={2.4} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  className="font-bold text-slate-800 uppercase"
                  style={{ fontSize: 10 * designScale, lineHeight: 15 * designScale, letterSpacing: 0.25 * designScale }}
                >
                  {offer.title}
                </Text>
                <Text
                  className="font-bold text-slate-800"
                  style={{ marginTop: 2 * designScale, fontSize: 14 * designScale, lineHeight: 20 * designScale }}
                >
                  {offer.desc}
                </Text>
                <Text
                  className="font-bold text-slate-400"
                  style={{ marginTop: 4 * designScale, fontSize: 10 * designScale, lineHeight: 15 * designScale }}
                >
                  Exp: Nov 30 • Use in-store
                </Text>
              </View>
            </View>
            <AppPressable
              onPress={() => {
                const card = couponRefs.current[offer.id];
                if (!card) {
                  setTransitionOrigin({ x: 24, y: 300, width: 377, height: 180 });
                  setSelectedCoupon(offer);
                  return;
                }
                card.measureInWindow((x, y, measuredWidth, measuredHeight) => {
                  setTransitionOrigin({ x, y, width: measuredWidth, height: measuredHeight });
                  setSelectedCoupon(offer);
                });
              }}
              className="w-full bg-slate-50 items-center"
              style={[elevation.card, { marginTop: 8 * designScale, paddingVertical: 12 * designScale, borderRadius: 12 * designScale }]}
            >
              <Text className="text-green-700 font-bold" style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}>
                View &amp; Use Coupon
              </Text>
            </AppPressable>
          </View>
          </Animated.View>
        ))}
      </View>

      {selectedCoupon && transitionOrigin && (
        <CouponDetailModal
          coupon={selectedCoupon}
          origin={transitionOrigin}
          onClose={() => {
            setSelectedCoupon(null);
            setTransitionOrigin(null);
          }}
        />
      )}
    </View>
  );
}
