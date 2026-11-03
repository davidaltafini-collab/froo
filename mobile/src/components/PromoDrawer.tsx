import React from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from './Text';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from './LinearGradient';
import Svg, { G, Path } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Share2, X, Leaf } from 'lucide-react-native';
import { AppPressable } from './AppPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { elevation } from '../theme/elevation';
import { imageSource, isCutout, type ImageRef } from '../theme/image';
import { BISTRO } from '../data/bistro';
import { useSwipeDownSurface } from './useSwipeDownSurface';
type AdItem = { img: ImageRef; title: string; desc: string };

type TitleSegment = { text: string; className?: string };

type PartnerAd = {
  id: number;
  tag: string;
  tagColor: string;
  titleLines: TitleSegment[][];
  titleText: string;
  subtitle: string;
  subtitleColor: string;
  desc: string;
  img: ImageRef;
  bgColor: string;
  fillColor: string;
  gradient: [string, string, string];
  btnClass: string;
  btnTextClass: string;
  articleSectionTitle: string;
  articleSectionBg: string;
  articleSectionText: string;
  articleSectionDesc: string;
  articleBtn: string;
  articleBtnText: string;
  items: AdItem[];
};

export const PARTNER_ADS: PartnerAd[] = [
  {
    id: 1,
    tag: 'Froo Bistro',
    tagColor: '#006320',
    titleLines: [[{ text: 'Hot' }], [{ text: 'From The', className: 'text-orange-400' }], [{ text: 'Bistro' }]],
    titleText: 'HOT FROM THE BISTRO.',
    subtitle: 'Autumn Menu',
    subtitleColor: 'text-green-400',
    desc: 'Crispy tenders, loaded hot dogs and pressed paninis, made fresh in every froo store. Every bite earns points.',
    img: BISTRO.crocantBox.image,
    bgColor: 'bg-[#006320]',
    fillColor: 'rgb(0,99,32)',
    gradient: ['transparent', 'rgba(0,99,32,0.4)', 'rgb(0,99,32)'],
    btnClass: 'bg-orange-500 text-white',
    btnTextClass: 'text-white',
    articleSectionTitle: 'MADE FRESH.',
    articleSectionBg: 'bg-[#006320]',
    articleSectionText: 'text-white',
    articleSectionDesc: 'Every froo Bistro cooks to order all day, so what you pick up is hot, crispy and ready to go.',
    articleBtn: 'bg-white text-[#006320]',
    articleBtnText: 'Find a Bistro',
    items: [
      { img: BISTRO.hotdog.image, title: BISTRO.hotdog.name, desc: 'Pickles, mustard, crispy onions.' },
      { img: BISTRO.chickenPanini.image, title: BISTRO.chickenPanini.name, desc: 'Pressed to order.' },
      { img: BISTRO.donerWrap.image, title: BISTRO.donerWrap.name, desc: 'Grilled chicken, garlic sauce.' },
    ],
  },
  {
    id: 2,
    tag: 'Exclusive',
    tagColor: '#881337',
    titleLines: [[{ text: 'Bake' }], [{ text: 'Like A', className: 'text-pink-300' }], [{ text: 'Pro' }]],
    titleText: 'BAKE LIKE A PRO.',
    subtitle: 'Masterclass Series',
    subtitleColor: 'text-pink-300',
    desc: 'Elevate your baking with our premium French butter, organic Madagascar vanilla, and artisanal flour blends.',
    img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800',
    bgColor: 'bg-rose-900',
    fillColor: 'rgb(136,19,55)',
    gradient: ['transparent', 'rgba(136,19,55,0.4)', 'rgb(136,19,55)'],
    btnClass: 'bg-pink-300 text-rose-900',
    btnTextClass: 'text-rose-900',
    articleSectionTitle: 'CRAFTED WITH CARE.',
    articleSectionBg: 'bg-rose-900',
    articleSectionText: 'text-white',
    articleSectionDesc: 'Our baking ingredients are sourced from generations-old mills and independent dairy farms to ensure exceptional quality in every bite.',
    articleBtn: 'bg-white text-rose-900',
    articleBtnText: 'Shop Essentials',
    items: [
      { img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400', title: 'French Butter', desc: 'Cultured and rich.' },
      { img: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&q=80&w=400', title: 'Artisan Flour', desc: 'Stone-ground.' },
      { img: 'https://images.unsplash.com/photo-1682482198446-4cbf92f85a4b?auto=format&fit=crop&q=80&w=400', title: 'Vanilla Bean', desc: 'Madagascar sourced.' },
    ],
  },
  {
    id: 3,
    tag: 'New Arrivals',
    tagColor: '#312e81',
    titleLines: [[{ text: 'Coffee' }], [{ text: 'House', className: 'text-amber-400' }], [{ text: 'Blend' }]],
    titleText: 'COFFEE HOUSE BLEND.',
    subtitle: 'Morning Rituals',
    subtitleColor: 'text-amber-400',
    desc: 'Start your day right with our new single-origin roasts, creamy oat milks, and fresh-baked artisanal pastries.',
    img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800',
    bgColor: 'bg-indigo-900',
    fillColor: 'rgb(49,46,129)',
    gradient: ['transparent', 'rgba(49,46,129,0.4)', 'rgb(49,46,129)'],
    btnClass: 'bg-amber-400 text-indigo-900',
    btnTextClass: 'text-indigo-900',
    articleSectionTitle: 'THE PERFECT CUP.',
    articleSectionBg: 'bg-indigo-900',
    articleSectionText: 'text-white',
    articleSectionDesc: 'We partner with fair-trade cooperatives globally to bring you ethically sourced, sustainably grown coffee beans.',
    articleBtn: 'bg-white text-indigo-900',
    articleBtnText: 'Discover Roasts',
    items: [
      { img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=400', title: 'Single Origin', desc: 'Ethiopian Yirgacheffe.' },
      { img: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=400', title: 'Oat Barista', desc: 'Perfectly steamed.' },
      { img: 'https://images.unsplash.com/photo-1542840410-3092f99611a3?auto=format&fit=crop&q=80&w=400', title: 'Dark 70%', desc: 'Rich and intense.' },
    ],
  },
];

function HeaderHandle({ color = '#006320' }: { color?: string }) {
  return (
    <Svg viewBox="0 0 367 90" style={{ width: '104%', aspectRatio: 367 / 90, marginLeft: '-2%' }}>
      <G transform="matrix(1,0,0,1,-23.653571,19.106469)">
        <G transform="matrix(-1,-0,0,-0.804295,419,59.416085)">
          <Path
            d="M391.822,73.873C438.622,73.519 3.41,74.655 30,73.873C48.197,73.339 158.613,0 209.5,0C267.103,0 351.203,74.181 391.822,73.873Z"
            fill={color}
          />
        </G>
        <G transform="matrix(0.016313,0,0,0.016313,209.381786,25.492708)">
          <G transform="matrix(1,0,0,1,-3959.333333,-2734)">
            <G transform="matrix(7.733073,0,0,7.733073,0,0)">
              <Path d="M571.497,253.058C578.14,253.273 578.044,253.294 584.552,254.05C629.165,259.233 652.552,290.924 656.711,321.473C669.226,413.391 572.31,446.264 516.165,402.93C466.819,364.844 472.73,256.702 571.497,253.058ZM611.044,337.494C610.955,335.821 610.982,334.143 610.892,332.47C608.128,280.746 536.334,283.29 532.977,331.54C529.529,381.089 577.754,392.316 599.305,369.312C611.232,356.581 610.786,341.852 611.044,337.494Z" fill="#fefefe" />
              <Path d="M766.499,253.055C772.616,253.283 772.529,253.298 778.557,254.002C837.066,260.831 850.456,307.414 852.001,325.546C860.184,421.608 757.171,443.963 707.659,400.321C661.318,359.473 670.338,256.124 766.499,253.055ZM805.079,346.434C805.228,344.789 805.445,343.151 805.594,341.507C811.019,281.589 732.231,280.863 727.942,329.545C723.807,376.477 761.282,386.23 780.408,378.268C800.638,369.846 803.321,353.395 805.079,346.434Z" fill="#fefefe" />
              <Path d="M465.537,487.053C609.169,496.583 676.365,430.879 678.036,438.658C678.6,441.283 684.889,470.555 684.741,471.539C684.094,475.849 551.898,577.142 384.691,516.011C345.976,501.857 305.671,475.148 304.893,471.469C304.814,471.097 310.728,437.925 312.547,437.767C313.926,437.647 361.818,470.26 432.438,482.792C438.448,483.859 438.409,483.711 465.537,487.053Z" fill="#fefefe" />
              <Path d="M267.5,253.067C296.477,253.067 298.144,252.504 298.164,255.507C298.343,283.042 299.133,283.214 298.022,285.325C296.716,287.808 249.622,285.205 247.762,286.794C247.072,287.383 247.153,287.597 247.153,388.5C247.153,419.925 247.742,421.693 244.504,421.716C241.142,421.741 203.842,422.015 202.48,421.551C201.185,421.109 201.337,420.488 201.336,295.5C201.336,289.331 203.67,286.348 197.5,286.331C175.265,286.271 171.954,287.044 171.69,284.48C171.679,284.37 171.634,255.064 171.719,254.539C172.372,250.531 201.692,255.472 202.059,251.441C204.164,228.283 193.734,167.99 272.48,171.918C282.741,172.43 305.453,176.242 306.182,179.515C306.41,180.539 302.424,207.779 302.304,208.462C301.438,213.394 299.341,210.818 294.454,209.688C243.804,197.981 247.021,229.314 247.154,250.509C247.176,253.93 250.515,253.067 267.5,253.067Z" fill="#fefefe" />
              <Path d="M439.502,253.046C442.153,253.18 462.294,254.202 471.218,262.801C472.42,263.959 472.048,264.297 462.63,300.552C461.096,306.46 456.391,293.248 429.488,294.221C407.319,295.023 394.966,312.051 394.122,327.467C393.501,338.81 394.868,420.022 393.324,421.29C392.711,421.793 392.59,421.721 355.5,421.718C350.334,421.718 347.813,423.696 347.81,418.498C347.729,295.352 348.683,294.249 344.169,289.849C339.159,284.965 331.796,288.837 331.785,283.497C331.732,256.461 331.631,255.783 333.383,255.178C336.892,253.967 358.232,251.651 368.611,255.134C395.243,264.069 387.211,280.132 391.35,279.207C391.411,279.193 396.123,265.913 411.638,258.807C424.368,252.977 433.899,253.25 439.502,253.046Z" fill="#fefefe" />
            </G>
          </G>
        </G>
      </G>
    </Svg>
  );
}

function EditorialOverlay({ onClose, ad }: { onClose: () => void; ad: PartnerAd }) {
  const { height } = useWindowDimensions();
  // Slides up as a sheet; pull down anywhere while scrolled to the top to close it.
  const { requestClose, surfaceAnimatedStyle, contentGesture, scrollProps } = useSwipeDownSurface({
    closedOffset: height,
    onClosed: onClose,
    dismissDistanceRatio: 0.16,
  });

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={[elevation.floating, {
          flex: 1,
          overflow: 'hidden',
          borderRadius: 28,
          backgroundColor: '#ffffff',
        }, surfaceAnimatedStyle]}
      >
      <GestureDetector gesture={contentGesture}>
      <Animated.ScrollView {...scrollProps} showsVerticalScrollIndicator={false}>
        <View className="relative w-full" style={{ height: height * 0.6 }}>
          {isCutout(ad.img) ? (
            // Bistro cut-out: the product sits on the brand green instead of a full-bleed photo.
            <View style={[StyleSheet.absoluteFill, { backgroundColor: ad.fillColor }]}>
              <ExpoImage source={imageSource(ad.img)} style={{ position: 'absolute', top: '8%', left: '12%', width: '76%', height: '52%' }} contentFit="contain" />
            </View>
          ) : (
            <ExpoImage source={imageSource(ad.img)} style={{ width: '100%', height: '100%', position: 'absolute' }} contentFit="cover" />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.2)', 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} className="absolute inset-0" />
          <View className="absolute bottom-0 left-0 w-full p-8">
            <Text className={`${ad.subtitleColor} font-bold uppercase text-xs mb-3`}>{ad.subtitle}</Text>
            <Text className="text-5xl font-black text-white leading-[0.9] mb-4">{ad.titleText.replace(/ /g, '\n')}</Text>
            <Text className="text-white/80 text-sm max-w-[250px] leading-relaxed">{ad.desc}</Text>
          </View>
        </View>

        <View className="p-8 pb-20 bg-white">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-8 px-8" contentContainerStyle={{ gap: 16 }}>
            {ad.items.map((item, i) => (
              <View key={i} style={{ width: 200 }}>
                <View
                  className="w-full aspect-[4/5] rounded-[24px] overflow-hidden mb-4"
                  style={{ backgroundColor: isCutout(item.img) ? '#fbf3e8' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ExpoImage
                    source={imageSource(item.img)}
                    style={{ width: isCutout(item.img) ? '86%' : '100%', height: isCutout(item.img) ? '86%' : '100%' }}
                    contentFit={isCutout(item.img) ? 'contain' : 'cover'}
                  />
                </View>
                <Text className="font-bold text-slate-900 text-lg mb-1">{item.title}</Text>
                <Text className="text-slate-500 text-sm">{item.desc}</Text>
              </View>
            ))}
          </ScrollView>

          <View className={`w-full ${ad.articleSectionBg} rounded-[32px] p-8 relative overflow-hidden`}>
            <Leaf size={192} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', bottom: -40, right: -40 }} />
            <View className="relative z-10">
              <Text className="text-3xl font-black text-white leading-tight mb-4">{ad.articleSectionTitle.replace(/ /g, '\n')}</Text>
              <Text className="text-white/80 text-sm leading-relaxed mb-8">{ad.articleSectionDesc}</Text>
              <AppPressable className={`${ad.articleBtn} rounded-full py-3 px-6 self-start`}>
                <Text className="font-bold text-sm uppercase tracking-wider">{ad.articleBtnText}</Text>
              </AppPressable>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
      </GestureDetector>

      <AppPressable onPress={requestClose} className="absolute top-6 right-6 w-12 h-12 bg-black/20 rounded-full items-center justify-center z-20">
        <X size={24} color="white" />
      </AppPressable>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function PromoImageLayer({ ad, active }: { ad: PartnerAd; active: boolean }) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, {
      duration: 700,
      easing: Easing.inOut(Easing.ease),
    });
  }, [active, opacity]);

  const imageStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, imageStyle]}>
      {isCutout(ad.img) ? null : (
        <ExpoImage
          source={imageSource(ad.img)}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }}
          contentFit="cover"
        />
      )}
      <LinearGradient
        colors={ad.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

export function PromoDrawer() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shellScale = windowWidth / 425;
  // Keep the green background full-bleed while moving its logo and pull target below
  // notches/camera islands. On a rectangular viewport this remains the original -20.
  const safeHeaderShift = Math.max(0, insets.top - 8 * shellScale);
  const collapsedY = -20 * shellScale + safeHeaderShift;
  const openY = windowHeight - insets.bottom - 200 * shellScale + safeHeaderShift;
  const snapEasing = Easing.bezier(0.32, 0.72, 0, 1);

  /**
   * How far the closed panel's bottom edge sits below the top of the screen.
   *
   * The panel hangs off the top of the handle and is pulled back down by both `collapsedY` (which
   * carries `safeHeaderShift`, so it grows with the notch/Dynamic Island inset) and the panel's
   * own +25 nudge. On a rectangular Android viewport that lands at roughly zero, but on a deep
   * inset it puts the last few points of the closed panel back on screen — which is why the
   * bottom of the CTA row was showing above the green header. Everything below is measured from
   * this so the panel is laid out to clear it on any device instead of relying on a fixed number.
   */
  const collapsedOverhang = Math.max(0, collapsedY + 25 * shellScale);
  /** Overhang plus margin, so the CTA row clears the screen edge rather than just touching it. */
  const panelBottomClearance = collapsedOverhang + 24 * shellScale;

  const [currentAdIndex, setCurrentAdIndex] = React.useState(0);
  const [contentAdIndex, setContentAdIndex] = React.useState(0);
  const [activeEditorialAd, setActiveEditorialAd] = React.useState<PartnerAd | null>(null);
  const [showEditorial, setShowEditorial] = React.useState(false);
  const [isPromoOpen, setIsPromoOpen] = React.useState(false);
  const [hasInteractedWithPromo, setHasInteractedWithPromo] = React.useState(false);
  const currentAdIndexRef = React.useRef(0);

  const translateY = useSharedValue(collapsedY);
  const dragStartY = useSharedValue(collapsedY);
  const wiggle = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(15 * shellScale);

  const currentAd = PARTNER_ADS[currentAdIndex];
  const contentAd = PARTNER_ADS[contentAdIndex];

  const commitContentAd = React.useCallback((index: number) => {
    setContentAdIndex(index);
  }, []);

  const advanceAd = React.useCallback(() => {
    const nextIndex = (currentAdIndexRef.current + 1) % PARTNER_ADS.length;
    currentAdIndexRef.current = nextIndex;

    contentOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    contentTranslateY.value = withTiming(
      -15 * shellScale,
      { duration: 500, easing: Easing.out(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(commitContentAd)(nextIndex);
      },
    );
    setCurrentAdIndex(nextIndex);
  }, [commitContentAd, contentOpacity, contentTranslateY, shellScale]);

  React.useEffect(() => {
    const interval = setInterval(advanceAd, 6000);
    return () => clearInterval(interval);
  }, [advanceAd]);

  React.useEffect(() => {
    contentOpacity.value = 0;
    contentTranslateY.value = 15 * shellScale;
    contentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    contentTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [contentAdIndex, contentOpacity, contentTranslateY, shellScale]);

  const markInteracted = React.useCallback(() => setHasInteractedWithPromo(true), []);
  const markOpen = React.useCallback(() => setIsPromoOpen(true), []);
  const markClosed = React.useCallback(() => setIsPromoOpen(false), []);

  React.useEffect(() => {
    if (hasInteractedWithPromo || isPromoOpen) {
      cancelAnimation(wiggle);
      wiggle.value = withTiming(0, { duration: 200 });
      return;
    }
    wiggle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3200 }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteractedWithPromo, isPromoOpen]);

  React.useEffect(() => {
    translateY.value = withTiming(isPromoOpen ? openY : collapsedY, {
      duration: 280,
      easing: snapEasing,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPromoOpen, openY, collapsedY]);

  const createPanGesture = (enabled: boolean) => Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onStart(() => {
      runOnJS(markInteracted)();
    })
    .onUpdate((e) => {
      const next = dragStartY.value + e.translationY;
      if (next < collapsedY) {
        translateY.value = collapsedY + (next - collapsedY) * 0.1;
      } else if (next > openY) {
        translateY.value = openY + (next - openY) * 0.1;
      } else {
        translateY.value = next;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 88 * shellScale || e.velocityY > 850) {
        translateY.value = withTiming(openY, { duration: 280, easing: snapEasing });
        runOnJS(markOpen)();
      } else if (e.translationY < -88 * shellScale || e.velocityY < -850) {
        translateY.value = withTiming(collapsedY, { duration: 240, easing: snapEasing });
        runOnJS(markClosed)();
      } else {
        translateY.value = withTiming(isPromoOpen ? openY : collapsedY, {
          duration: 220,
          easing: snapEasing,
        });
      }
    });
  const contentPan = createPanGesture(isPromoOpen);
  const handlePan = createPanGesture(true);

  const drawerStyle = useAnimatedStyle(() => ({
    // The discoverability hint belongs to the drawer, not only to its SVG handle. Keeping the
    // same 8px trajectory on the common parent prevents a white seam from opening underneath it.
    transform: [{ translateY: translateY.value + 8 * shellScale * wiggle.value }],
  }));

  const wiggleStyle = useAnimatedStyle(() => ({
    shadowColor: hasInteractedWithPromo || isPromoOpen ? '#000000' : '#86efac',
    shadowOffset: { width: 0, height: (hasInteractedWithPromo || isPromoOpen ? 2 : 8) * shellScale },
    shadowOpacity: hasInteractedWithPromo || isPromoOpen ? 0.2 : 0.7 * wiggle.value,
    shadowRadius: (hasInteractedWithPromo || isPromoOpen ? 6 : 16 * wiggle.value) * shellScale,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <>
      {isPromoOpen && (
        <AppPressable
          onPress={() => setIsPromoOpen(false)}
          className="absolute inset-0 z-30"
        />
      )}

      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 }, drawerStyle]}
      >
        <GestureDetector gesture={contentPan}>
          <View
            pointerEvents={isPromoOpen ? 'auto' : 'none'}
            className="w-full overflow-hidden"
            style={{
              // A fixed 850 (scaled only by width) falls short of the drag distance on taller
              // screens or deep top insets: the panel's top edge lands below the screen's y=0 and
              // the dashboard shows through above the green mid-drag. Exceeding the full travel
              // (openY) plus the closed overhang keeps green covering the top on every device.
              height: Math.max(850 * shellScale, openY + 60 * shellScale) + panelBottomClearance,
              position: 'absolute',
              bottom: '100%',
              transform: [{ translateY: 25 * shellScale }],
            }}
          >
            <View className={`relative w-full h-full ${currentAd.bgColor}`}>
              {PARTNER_ADS.map((ad, index) => (
                <PromoImageLayer key={ad.id} ad={ad} active={index === currentAdIndex} />
              ))}
              <LinearGradient
                colors={['#006320', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 96 * shellScale }}
              />

              <View
                className="relative z-10 flex-1 justify-end"
                style={{
                  padding: 32 * shellScale,
                  // The content is bottom-anchored, so the CTA row is whatever the closed panel
                  // leaves hanging on screen. Clearing the overhang here is what keeps the closed
                  // state showing nothing but green, no matter how deep the device's top inset is.
                  paddingBottom: 56 * shellScale + panelBottomClearance,
                }}
              >
                <View style={{ position: 'absolute', top: 80 * shellScale, right: 24 * shellScale }}>
                  <AppPressable
                    onPress={() => setIsPromoOpen(false)}
                    className="bg-white/20 rounded-full"
                    style={{ padding: 12 * shellScale }}
                  >
                    <X size={24 * shellScale} color="white" />
                  </AppPressable>
                </View>

                <Animated.View style={[contentStyle, { gap: 20 * shellScale }]}>
                  {isCutout(contentAd.img) ? (
                    // Bistro product photo, laid out with the copy so it always sits right above
                    // the headline whatever the screen height.
                    <ExpoImage
                      source={imageSource(contentAd.img)}
                      style={{ width: 230 * shellScale, height: 190 * shellScale, alignSelf: 'flex-end', marginBottom: -36 * shellScale, transform: [{ rotate: '-8deg' }] }}
                      contentFit="contain"
                    />
                  ) : null}
                  <View className="self-start">
                    <View
                      className="bg-white rounded-full"
                      style={{
                        paddingHorizontal: 16 * shellScale,
                        paddingVertical: 8 * shellScale,
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Text
                        style={{
                          color: contentAd.tagColor,
                          fontSize: 10 * shellScale,
                          lineHeight: 14 * shellScale,
                          letterSpacing: 2 * shellScale,
                        }}
                        className="font-black uppercase"
                      >
                        {contentAd.tag}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 8 * shellScale }}>
                    {contentAd.titleLines.map((line, i) => (
                      <View key={i} className="flex-row">
                        {line.map((seg, j) => (
                          <Text
                            key={j}
                            className={`font-black uppercase ${seg.className ?? 'text-white'}`}
                            style={{
                              fontSize: 64 * shellScale,
                              // Was 54.4 (0.85x the font size) — smaller than the font's own
                              // glyph box, which Android tolerates by overflowing but iOS clips
                              // hard against. 1:1 is the safe floor for a 900-weight face.
                              lineHeight: 64 * shellScale,
                              letterSpacing: -3.2 * shellScale,
                              textShadowColor: 'rgba(0,0,0,0.24)',
                              textShadowOffset: { width: 0, height: 3 * shellScale },
                              textShadowRadius: 8 * shellScale,
                            }}
                          >
                            {seg.text}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>

                  <Text
                    className="text-white/90 font-medium"
                    style={{
                      maxWidth: 280 * shellScale,
                      marginTop: 8 * shellScale,
                      fontSize: 18 * shellScale,
                      lineHeight: 24.75 * shellScale,
                      textShadowColor: 'rgba(0,0,0,0.22)',
                      textShadowOffset: { width: 0, height: 2 * shellScale },
                      textShadowRadius: 4 * shellScale,
                    }}
                  >
                    {contentAd.desc}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 16 * shellScale, marginTop: 16 * shellScale }}>
                    <AppPressable
                      onPress={() => { setActiveEditorialAd(contentAd); setShowEditorial(true); setIsPromoOpen(false); }}
                      className={`${contentAd.btnClass} rounded-full flex-1 items-center`}
                      style={{
                        paddingVertical: 16 * shellScale,
                        paddingHorizontal: 32 * shellScale,
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.18)',
                      }}
                    >
                      <Text
                        className={`${contentAd.btnTextClass} font-bold uppercase`}
                        style={{ fontSize: 14 * shellScale, lineHeight: 20 * shellScale, letterSpacing: 0.7 * shellScale }}
                      >
                        Explore Now
                      </Text>
                    </AppPressable>
                    <AppPressable
                      className="bg-white/20 rounded-full items-center justify-center"
                      style={{
                        paddingVertical: 16 * shellScale,
                        paddingHorizontal: 24 * shellScale,
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.18)',
                      }}
                    >
                      <Share2 size={20 * shellScale} color="white" />
                    </AppPressable>
                  </View>
                </Animated.View>
              </View>
            </View>
          </View>
        </GestureDetector>

        <View className="relative w-full" pointerEvents="box-none">
          <Animated.View pointerEvents="none" style={wiggleStyle}>
            <HeaderHandle color="#006320" />
          </Animated.View>
          <GestureDetector gesture={handlePan}>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: '25%',
                width: '50%',
                height: 62 * shellScale,
              }}
            />
          </GestureDetector>
        </View>
      </Animated.View>

      {showEditorial && activeEditorialAd && (
        <EditorialOverlay ad={activeEditorialAd} onClose={() => setShowEditorial(false)} />
      )}
    </>
  );
}
