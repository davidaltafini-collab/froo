import './global.css';

import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from './src/components/Text';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { Bell, Home, MapPin, QrCode, ScanLine, ShoppingBag, Tag, Timer } from 'lucide-react-native';

import * as SplashScreen from 'expo-splash-screen';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { AppPressable } from './src/components/AppPressable';
import { NavItem } from './src/components/SharedUI';
import { PromoDrawer } from './src/components/PromoDrawer';
import { DashboardView } from './src/views/DashboardView';
import { CouponsView } from './src/views/CouponsView';
import { ListView } from './src/views/ListView';
import { StoresView } from './src/views/StoresView';
import {
  ActivePromotionOverlay,
  HistoryOverlay,
  NotificationsOverlay,
  PersonalGameOverlay,
  ProfileOverlay,
  RewardsOverlay,
  ScannerOverlay,
} from './src/components/overlays';
import { useAppFonts } from './src/theme/fonts';
import { useHardwareBack } from './src/hooks/useHardwareBack';
import { BackdropBlur } from './src/components/BackdropBlur';
import { imageSource, isCutout } from './src/theme/image';
import SarahAvatar from './assets/brand/avatar-sarah.svg';
import { elevation, glow } from './src/theme/elevation';
// Hold the native splash until Inter is registered. Without this the first frame renders in the
// platform default face and visibly reflows once the real font swaps in.
SplashScreen.preventAutoHideAsync().catch(() => {});

const qrCardEntering = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 20 }, { scale: 0.9 }] },
    animations: {
      opacity: withTiming(1, { duration: 220 }),
      transform: [
        { translateY: withTiming(0, { duration: 220 }) },
        { scale: withTiming(1, { duration: 220 }) },
      ],
    },
  };
};

const qrCardExiting = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: 160 }),
      transform: [
        { translateY: withTiming(20, { duration: 160 }) },
        { scale: withTiming(0.9, { duration: 160 }) },
      ],
    },
  };
};

function QrModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shellScale = windowWidth / 425;

  // Flick or drag the card down to put it away (tapping outside or Done still work too).
  const dragY = useSharedValue(0);
  React.useEffect(() => {
    if (visible) dragY.value = 0;
  }, [visible, dragY]);
  const cardDrag = React.useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY(8)
        .failOffsetX([-24, 24])
        .onUpdate((event) => {
          dragY.value = event.translationY < 0 ? event.translationY * 0.12 : event.translationY;
        })
        .onEnd((event) => {
          if (dragY.value > 110 || event.velocityY > 800) {
            dragY.value = withTiming(windowHeight * 0.6, { duration: 200 }, (finished) => {
              if (finished) runOnJS(onClose)();
            });
          } else {
            dragY.value = withSpring(0, { damping: 28, stiffness: 320, overshootClamping: true });
          }
        }),
    [dragY, onClose, windowHeight],
  );
  const cardDragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    opacity: 1 - Math.min(0.6, Math.max(0, dragY.value) / 500),
  }));

  const backdropDragStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.max(0, dragY.value) / 420),
  }));

  if (!visible) return null;
  const bars = [1, 2, 1, 0.5, 3, 1, 1.5, 2, 1, 0.5];
  const bars2 = [2, 1, 0.5, 2, 1, 1.5, 1, 3, 0.5, 1];
  const bars3 = [1, 2, 1, 0.5, 3, 1, 1.5, 2, 1, 0.5];
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* Dim + blur fade out as the card is dragged away. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.4)' }, backdropDragStyle]}>
        <BackdropBlur />
      </Animated.View>
      <AppPressable onPress={onClose} style={StyleSheet.absoluteFill} />
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: insets.bottom,
          left: 0,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24 * shellScale,
        }}
      >
        <GestureDetector gesture={cardDrag}>
        <Animated.View style={cardDragStyle}>
        <Animated.View
          entering={qrCardEntering}
          exiting={qrCardExiting}
          style={{
            width: 320 * shellScale,
            height: 422 * shellScale,
            padding: 32 * shellScale,
            borderRadius: 32 * shellScale,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
          }}
        >
          <View
            style={{
              paddingHorizontal: 16 * shellScale,
              paddingVertical: 6 * shellScale,
              borderRadius: 12 * shellScale,
              marginBottom: 32 * shellScale,
              backgroundColor: '#f0fdf4',
            }}
          >
            <Text
              className="text-green-700 font-bold uppercase"
              style={{ fontSize: 10 * shellScale, lineHeight: 15 * shellScale, letterSpacing: shellScale }}
            >
              Scan at checkout
            </Text>
          </View>
          <View
            style={[elevation.well, {
              width: '100%',
              padding: 24 * shellScale,
              borderRadius: 24 * shellScale,
              backgroundColor: '#f8fafc',
              alignItems: 'center',
            }]}
          >
            <View
              style={{
                width: 128 * shellScale,
                height: 128 * shellScale,
                padding: 12 * shellScale,
                borderRadius: 12 * shellScale,
                marginBottom: 16 * shellScale,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View className="w-full h-full justify-between">
                {[bars, bars2, bars3].map((row, r) => (
                  <View key={r} style={{ flexDirection: 'row', gap: 4 * shellScale, height: 24 * shellScale }}>
                    {row.map((w, i) => (
                      <View key={i} style={{ width: w * 4 * shellScale, height: '100%', backgroundColor: '#1e293b' }} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <Text
              className="font-mono font-bold text-slate-400"
              style={{ fontSize: 10 * shellScale, lineHeight: 15 * shellScale, letterSpacing: shellScale }}
            >
              LM-9823-1102
            </Text>
          </View>
          <AppPressable
            onPress={onClose}
            style={{
              marginTop: 32 * shellScale,
              width: '100%',
              paddingVertical: 16 * shellScale,
              borderRadius: 16 * shellScale,
              backgroundColor: '#16a34a',
              alignItems: 'center',
              boxShadow: '0 10px 15px -3px rgba(187,247,208,0.8)',
            }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 14 * shellScale, lineHeight: 20 * shellScale }}>
              Done
            </Text>
          </AppPressable>
        </Animated.View>
        </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

/**
 * Web reference: each tab is a `motion.div` inside `<AnimatePresence mode="wait">`, going
 * `{opacity: 0, x: -10}` → `{opacity: 1, x: 0}` on enter and `{opacity: 0, x: 10}` on exit.
 *
 * Two details of that are load-bearing and were previously lost:
 *
 * 1. `mode="wait"` means the outgoing tab is fully gone before the incoming one mounts. Here the
 *    enter is delayed by exactly the exit duration to reproduce that hand-off.
 * 2. The panels must not participate in the parent's flex layout. Reanimated keeps an exiting
 *    view mounted for the length of its exit animation, so two `flex-1` siblings briefly share
 *    the column and each collapses to half height — the content visibly squashed and snapped
 *    back on every tab change. Absolute fill makes them overlap instead, which is also what the
 *    web's `AnimatePresence` produces.
 */
const TAB_EXIT_MS = 150;
const TAB_ENTER_MS = 220;

const tabEntering = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateX: -10 }] },
    animations: {
      opacity: withDelay(TAB_EXIT_MS, withTiming(1, { duration: TAB_ENTER_MS })),
      transform: [{ translateX: withDelay(TAB_EXIT_MS, withTiming(0, { duration: TAB_ENTER_MS })) }],
    },
  };
};

const tabExiting = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: TAB_EXIT_MS }),
      transform: [{ translateX: withTiming(10, { duration: TAB_EXIT_MS }) }],
    },
  };
};

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <Animated.ScrollView
      style={StyleSheet.absoluteFill}
      entering={tabEntering}
      exiting={tabExiting}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 112 }}
    >
      {children}
    </Animated.ScrollView>
  );
}

function AppShell() {
  const {
    activeTab, setActiveTab,
    showQR, setShowQR,
    isScanning, setIsScanning,
    showProfile, setShowProfile,
    showNotifications, setShowNotifications,
    showHistory, setShowHistory,
    profileInitialView, setProfileInitialView,
    showPersonalGame, setShowPersonalGame,
    showRewards, setShowRewards,
    redeemedItems,
    activePromotionItem, setActivePromotionItem,
    unreadCount,
  } = useAppContext();

  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const shellScale = windowWidth / 425;
  const safeHeaderShift = Math.max(0, insets.top - 8 * shellScale);

  const handleHardwareBack = React.useCallback(() => {
    if (showQR) { setShowQR(false); return true; }
    if (isScanning) { setIsScanning(false); return true; }
    if (showProfile) { setShowProfile(false); return true; }
    if (showPersonalGame) { setShowPersonalGame(false); return true; }
    if (activePromotionItem) { setActivePromotionItem(null); return true; }
    if (showNotifications) { setShowNotifications(false); return true; }
    if (showHistory) { setShowHistory(false); return true; }
    return false;
  }, [showQR, isScanning, showProfile, showPersonalGame, activePromotionItem, showNotifications, showHistory, setShowQR, setIsScanning, setShowProfile, setShowPersonalGame, setActivePromotionItem, setShowNotifications, setShowHistory]);
  useHardwareBack(handleHardwareBack);

  const activeRewards = Object.values(redeemedItems).filter((r) => r.expiry > Date.now());
  const hasActiveReward = activeRewards.length > 0 && activeTab === 'home';

  return (
    <View
      className="flex-1 bg-white"
      style={{
        borderRadius: 28 * shellScale,
        overflow: 'hidden',
      }}
    >
      {/* Header spacer - reserves layout space above the scrollable content */}
      <View
        style={{ height: 122 * shellScale + safeHeaderShift, boxShadow: '0 8px 18px -14px rgba(15, 23, 42, 0.35)' }}
        className="relative z-10 bg-white"
      />

      {/* Promo Drawer - draggable green header that opens into a promotions drawer */}
      <PromoDrawer />

      {/* Header controls (avatar / notifications) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 49 * shellScale + safeHeaderShift,
          left: 0,
          right: 0,
          height: 64 * shellScale,
          zIndex: 35,
        }}
      >
        <AppPressable
          onPress={() => { setProfileInitialView('main'); setShowProfile(true); }}
          // 112 wide (centred on the same x as the original 86-wide slot) so the full name never
          // ellipsizes when Android measures the bold face slightly wider than the web reference.
          style={{ position: 'absolute', left: 21 * shellScale, top: 0, width: 112 * shellScale, alignItems: 'center', gap: 4 * shellScale }}
        >
          <View
            className="bg-slate-200 items-center justify-center overflow-hidden"
            style={[elevation.card, {
              width: 40 * shellScale,
              height: 40 * shellScale,
              borderRadius: 20 * shellScale,
            }]}
          >
            <SarahAvatar width="100%" height="100%" />
          </View>
          <Text
            className="font-bold text-slate-900"
            style={{ fontSize: 12 * shellScale, lineHeight: 12 * shellScale }}
            numberOfLines={1}
          >
            Necula David
          </Text>
        </AppPressable>

        <AppPressable
          onPress={() => setShowNotifications(true)}
          style={{
            position: 'absolute',
            right: 39 * shellScale,
            top: 0,
            width: 40 * shellScale,
            height: 40 * shellScale,
            borderRadius: 20 * shellScale,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={24 * shellScale} color="#94a3b8" />
          {unreadCount > 0 && (
            <View
              className="absolute bg-red-500 items-center justify-center"
              style={[elevation.card, {
                top: 4 * shellScale,
                right: 4 * shellScale,
                width: 16 * shellScale,
                height: 16 * shellScale,
                borderRadius: 8 * shellScale,
              }]}
            >
              <Text style={{ fontSize: 8 * shellScale }} className="text-white font-bold">{unreadCount}</Text>
            </View>
          )}
        </AppPressable>
      </View>

      {/* Scrollable tab content */}
      <View className="flex-1">
        {activeTab === 'home' && <TabPanel key="home"><DashboardView /></TabPanel>}
        {activeTab === 'coupons' && <TabPanel key="coupons"><CouponsView /></TabPanel>}
        {activeTab === 'list' && <TabPanel key="list"><ListView /></TabPanel>}
        {activeTab === 'stores' && <TabPanel key="stores"><StoresView /></TabPanel>}
      </View>

      {/* Active Rewards Floating */}
      {hasActiveReward && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            position: 'absolute',
            bottom: 85 * shellScale + insets.bottom + 8 * shellScale,
            left: 0,
            right: 0,
            paddingHorizontal: 16 * shellScale,
            zIndex: 20,
          }}
        >
          <View style={{ gap: 8 }}>
            {activeRewards.map((reward, i) => (
              <AppPressable
                key={i}
                onPress={() => setActivePromotionItem(reward.item)}
                className="bg-white/95 rounded-2xl p-3 flex-row items-center justify-between" style={elevation.card}
              >
                <View className="flex-row items-center gap-3">
                  <ExpoImage source={imageSource(reward.item.image)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isCutout(reward.item.image) ? '#fbf3e8' : undefined }} contentFit={isCutout(reward.item.image) ? 'contain' : 'cover'} />
                  <View>
                    <Text className="font-bold text-slate-900 text-sm leading-tight">{reward.item.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Timer size={12} color="#16a34a" />
                      <Text className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Tap to view QR</Text>
                    </View>
                  </View>
                </View>
                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                  <QrCode size={16} color="#16a34a" />
                </View>
              </AppPressable>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Bottom Navigation */}
      <View
        style={{
          height: 85 * shellScale + insets.bottom,
          paddingHorizontal: 24 * shellScale,
          paddingTop: 12 * shellScale,
          paddingBottom: 12 * shellScale + insets.bottom,
          // Lifted off the content with an upward shadow instead of a hairline.
          boxShadow: '0 -10px 24px -16px rgba(15, 23, 42, 0.28)',
        }}
        className="absolute bottom-0 w-full bg-white flex-row justify-between items-center z-20"
      >
        <NavItem scale={shellScale} icon={Home} label="Dashboard" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem scale={shellScale} icon={Tag} label="Offers" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />

        <View style={{ transform: [{ translateY: -24 * shellScale }] }}>
          <AppPressable
            onPress={() => setIsScanning(true)}
            className="bg-green-600"
            style={[glow('0, 166, 62', 0.55), {
              padding: 14 * shellScale,
              borderRadius: 16 * shellScale,
            }]}
          >
            <ScanLine size={24 * shellScale} color="white" />
          </AppPressable>
        </View>

        <NavItem scale={shellScale} icon={ShoppingBag} label="List" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
        <NavItem scale={shellScale} icon={MapPin} label="Stores" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
      </View>

      <QrModal visible={showQR} onClose={() => setShowQR(false)} />

      {isScanning && <ScannerOverlay onClose={() => setIsScanning(false)} />}
      {showProfile && <ProfileOverlay onClose={() => setShowProfile(false)} initialView={profileInitialView} />}
      {showPersonalGame && <PersonalGameOverlay onClose={() => setShowPersonalGame(false)} onShowRewards={() => setShowRewards(true)} />}
      {showRewards && <RewardsOverlay onClose={() => setShowRewards(false)} />}
      {activePromotionItem && <ActivePromotionOverlay onClose={() => setActivePromotionItem(null)} />}
      {showNotifications && <NotificationsOverlay onClose={() => setShowNotifications(false)} />}
      {showHistory && <HistoryOverlay onClose={() => setShowHistory(false)} />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  React.useEffect(() => {
    // Drop the splash once the faces are registered. If the font fails to load we still show the
    // app rather than hanging on the splash forever — it degrades to the platform face, which is
    // wrong-looking but recoverable, whereas a stuck splash is not.
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </ErrorBoundary>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
