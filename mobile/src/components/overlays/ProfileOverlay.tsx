import React from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from '../LinearGradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Award,
  ChevronRight,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  Plus,
  QrCode,
  Settings,
  Share2,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react-native';
import { ProfileMenuRow } from '../SharedUI';
import { AppPressable } from '../AppPressable';
import type { ProfileView } from '../../types';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import UserAvatar from '../../../assets/brand/avatar-sarah.svg';
import { elevation, glow } from '../../theme/elevation';
function Toggle({ on }: { on: boolean }) {
  return (
    <View className={`w-10 h-6 rounded-full relative ${on ? 'bg-green-500' : 'bg-slate-200'}`}>
      <View className={`w-4 h-4 bg-white rounded-full absolute top-1 ${on ? 'right-1' : 'left-1'}`} />
    </View>
  );
}

function SettingsRow({ title, desc, on }: { title: string; desc: string; on: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <Text className="font-bold text-sm text-slate-800">{title}</Text>
        <Text className="text-xs text-slate-500 mt-0.5">{desc}</Text>
      </View>
      <Toggle on={on} />
    </View>
  );
}

export function ProfileOverlay({ onClose, initialView = 'main' }: { onClose: () => void; initialView?: ProfileView }) {
  const { height, width } = useWindowDimensions();
  const [activeView, setActiveView] = React.useState<ProfileView>(initialView);
  const { requestClose, dragGesture, surfaceAnimatedStyle, contentGesture, scrollProps, resetScroll } = useSwipeDownSurface({
    closedOffset: height,
    onClosed: onClose,
    dismissDistanceRatio: 0.16,
  });

  React.useEffect(() => {
    resetScroll();
  }, [activeView, resetScroll]);

  // iOS back gesture: on a sub-page, dragging from the left edge pulls the page off to the right
  // and returns to the main profile page. The page follows the finger; letting go past a third
  // of the width (or with a rightward flick) commits, anything less springs back.
  const backX = useSharedValue(0);
  const [skipExit, setSkipExit] = React.useState(false);
  const finishSwipeBack = React.useCallback(() => {
    // The page is already off-screen: unmount it without replaying its slide-out.
    setSkipExit(true);
    requestAnimationFrame(() => {
      setActiveView('main');
      backX.value = 0;
      requestAnimationFrame(() => setSkipExit(false));
    });
  }, [backX]);
  const edgeBackGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(activeView !== 'main')
        .activeOffsetX(8)
        .failOffsetY([-20, 20])
        .onUpdate((event) => {
          backX.value = Math.max(0, event.translationX);
        })
        .onEnd((event) => {
          if (backX.value > width * 0.33 || event.velocityX > 600) {
            backX.value = withTiming(width, { duration: 200, easing: Easing.out(Easing.cubic) }, (finished) => {
              if (finished) runOnJS(finishSwipeBack)();
            });
          } else {
            backX.value = withSpring(0, { damping: 30, stiffness: 320, overshootClamping: true });
          }
        }),
    [activeView, backX, finishSwipeBack, width],
  );
  const backStyle = useAnimatedStyle(() => ({ transform: [{ translateX: backX.value }] }));
  const pageExit = skipExit ? undefined : SlideOutRight;

  const titles: Record<ProfileView, string> = {
    main: 'Account & Profile',
    edit_profile: 'Edit Profile',
    family_invite: 'Invite to Family',
    games: 'Family Games',
    payments: 'Payment Methods',
    settings: 'App Settings',
    help: 'Help & Support',
  };

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={[elevation.floating,
          StyleSheet.absoluteFill,
          {
            borderRadius: 28,
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
          },
          surfaceAnimatedStyle,
        ]}
      >
      <GestureDetector gesture={dragGesture}>
        <View className="px-6 pt-12 pb-4 bg-white flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {activeView !== 'main' && (
              <AppPressable onPress={() => setActiveView('main')} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                <ChevronRight size={20} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
              </AppPressable>
            )}
            <Text className="text-lg font-bold text-slate-800">{titles[activeView]}</Text>
          </View>
          <AppPressable onPress={requestClose} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
            <X size={20} color="#64748b" />
          </AppPressable>
        </View>
      </GestureDetector>

      <Animated.View style={[{ flex: 1 }, backStyle]}>
        {activeView === 'main' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
            <GestureDetector gesture={contentGesture}>
            <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 flex-row items-center gap-5" style={elevation.card}>
                <View className="w-20 h-20 rounded-2xl bg-slate-200 items-center justify-center overflow-hidden" style={elevation.card}>
                  <UserAvatar width="100%" height="100%" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-slate-800">Necula David</Text>
                  <Text className="text-sm text-slate-500 mt-1">david.necula@gmail.com</Text>
                  <AppPressable onPress={() => setActiveView('edit_profile')} className="mt-3 self-start bg-green-50 px-4 py-2 rounded-xl">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-green-700">Edit Profile</Text>
                  </AppPressable>
                </View>
              </View>

              <View className="bg-white rounded-[32px] p-6" style={elevation.card}>
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                      <Users size={20} color="#4f46e5" />
                    </View>
                    <View>
                      <Text className="font-bold text-slate-800 text-sm">Family Group</Text>
                      <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Share lists & points</Text>
                    </View>
                  </View>
                  <AppPressable onPress={() => setActiveView('family_invite')} className="bg-indigo-50 px-3 py-2 rounded-lg flex-row items-center gap-1">
                    <Plus size={12} color="#4f46e5" />
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Invite</Text>
                  </AppPressable>
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="flex-row">
                    <View className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden -mr-3" style={elevation.raised}>
                      <ExpoImage source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&fit=crop' }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    </View>
                    <View className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden" style={elevation.raised}>
                      <ExpoImage source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80&fit=crop' }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    </View>
                  </View>
                  <Text className="text-xs font-medium text-slate-500 flex-1">Sarah and Emma are in your family.</Text>
                </View>

                <View className="mt-5 pt-5 gap-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <ShoppingBag size={16} color="#94a3b8" />
                      <Text className="text-sm font-bold text-slate-700">Shared Shopping List</Text>
                    </View>
                    <Toggle on />
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <Award size={16} color="#94a3b8" />
                      <Text className="text-sm font-bold text-slate-700">Pool Loyalty Points</Text>
                    </View>
                    <Toggle on />
                  </View>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <Share2 size={16} color="#94a3b8" />
                      <Text className="text-sm font-bold text-slate-700">Share Digital Receipts</Text>
                    </View>
                    <Toggle on={false} />
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={['#fdc700', '#ff6900']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[32px] p-6 overflow-hidden" style={elevation.card}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-3">
                    <Text className="font-bold text-lg mb-1 text-white">Family Scratch &amp; Win</Text>
                    <Text className="text-sm font-medium text-yellow-100">Win points for your family pool!</Text>
                  </View>
                  <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                    <Gift size={24} color="white" />
                  </View>
                </View>
                <AppPressable onPress={() => setActiveView('games')} className="w-full mt-5 bg-white rounded-2xl py-3 items-center" style={elevation.card}>
                  <Text className="text-orange-600 font-bold">Play Now</Text>
                </AppPressable>
              </LinearGradient>

              <View className="bg-white rounded-[32px] p-2" style={elevation.card}>
                <ProfileMenuRow icon={CreditCard} title="Payment Methods" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('payments')} />
                <ProfileMenuRow icon={Settings} title="App Settings" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('settings')} />
                <ProfileMenuRow icon={HelpCircle} title="Help & Support" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('help')} />
              </View>

              <AppPressable className="w-full bg-white rounded-[32px] p-5 flex-row items-center justify-center gap-3" style={elevation.card}>
                <LogOut size={20} color="#dc2626" />
                <Text className="text-red-600 font-bold">Sign Out</Text>
              </AppPressable>
            </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        )}

        {activeView === 'games' && (
          <Animated.View
            entering={SlideInRight}
            exiting={pageExit}
            style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', padding: 24 }]}
          >
            <LinearGradient
              colors={['#fdc700', '#ff6900']}
              className="rounded-[32px] p-8 items-center justify-center overflow-hidden"
              style={{ minHeight: 568 }}
            >
              <View
                className="absolute top-10 left-10 w-4 h-4 bg-white/40"
                style={{ transform: [{ rotate: '45deg' }] }}
              />
              <View className="absolute bottom-10 right-10 w-6 h-6 rounded-full bg-white/40" />
              <Gift size={64} color="#fef9c3" style={{ marginBottom: 16 }} />
              <Text className="text-3xl font-extrabold mb-2 text-white text-center">Scratch &amp; Win</Text>
              <Text className="text-yellow-100 font-medium mb-8 text-center">Reveal 3 matching icons to win bonus points for your Family Pool!</Text>

              <View className="p-2 rounded-3xl w-full max-w-[240px] mb-6" style={[elevation.card, { backgroundColor: '#f54900' }]}>
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={{ width: '48%' }} className="aspect-square bg-white rounded-2xl items-center justify-center overflow-hidden">
                      <Award size={32} color="#f97316" />
                      <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: '#ffdf20' }}>
                        <Text className="font-bold text-xs uppercase" style={{ color: '#d08700' }}>Scratch</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-black/20 px-4 py-2 rounded-xl">
                <Text className="text-sm font-bold text-white">1 free play remaining this week</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {activeView === 'edit_profile' && (
          <Animated.View entering={SlideInRight} exiting={pageExit} style={StyleSheet.absoluteFill}>
            <GestureDetector gesture={contentGesture}>
            <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6" style={elevation.card}>
                <View className="items-center mb-6">
                  <View>
                    <View className="w-24 h-24 rounded-2xl bg-slate-200 items-center justify-center overflow-hidden" style={elevation.card}>
                      <UserAvatar width="100%" height="100%" />
                    </View>
                    <AppPressable className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full items-center justify-center" style={elevation.raised}>
                      <Plus size={16} color="white" />
                    </AppPressable>
                  </View>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Full Name</Text>
                    <TextInput defaultValue="Necula David" className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" style={elevation.well} />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Email Address</Text>
                    <TextInput defaultValue="david.necula@gmail.com" keyboardType="email-address" className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" style={elevation.well} />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Phone Number</Text>
                    <TextInput defaultValue="+40 712 345 678" keyboardType="phone-pad" className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" style={elevation.well} />
                  </View>

                  <AppPressable onPress={() => setActiveView('main')} className="w-full mt-4 bg-green-600 rounded-2xl py-4 items-center" style={glow('0, 166, 62')}>
                    <Text className="text-white font-bold">Save Changes</Text>
                  </AppPressable>
                </View>
              </View>
            </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        )}

        {activeView === 'family_invite' && (
          <Animated.View
            entering={SlideInRight}
            exiting={pageExit}
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}
          >
            <View className="bg-white rounded-[32px] p-8 items-center max-w-sm w-full" style={elevation.card}>
              <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
                <Users size={32} color="#4f46e5" />
              </View>
              <Text className="text-xl font-bold text-slate-800 mb-2">Invite Family Member</Text>
              <Text className="text-sm text-slate-500 mb-8 text-center leading-relaxed">Let them scan this code with their camera to join your family group.</Text>

              <View className="bg-white p-4 rounded-3xl mb-8" style={elevation.card}>
                <QrCode size={192} color="#1e293b" />
              </View>

              <View className="flex-row items-center gap-4 w-full">
                <View className="h-[1px] flex-1 bg-slate-100" />
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or send link</Text>
                <View className="h-[1px] flex-1 bg-slate-100" />
              </View>

              <AppPressable className="w-full mt-6 bg-indigo-600 rounded-2xl py-4 items-center flex-row justify-center gap-2" style={glow('79, 57, 246')}>
                <Share2 size={20} color="white" />
                <Text className="text-white font-bold">Share Invite Link</Text>
              </AppPressable>
            </View>
          </Animated.View>
        )}

        {activeView === 'payments' && (
          <Animated.View entering={SlideInRight} exiting={pageExit} style={StyleSheet.absoluteFill}>
            <GestureDetector gesture={contentGesture}>
            <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-5 flex-row items-center justify-between" style={elevation.card}>
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-8 bg-blue-100 rounded items-center justify-center">
                    <Text className="text-blue-800 font-bold text-xs italic">VISA</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-sm text-slate-800">•••• 4242</Text>
                    <Text className="text-[10px] text-slate-500 font-medium">Expires 12/28</Text>
                  </View>
                </View>
                <View className="bg-green-50 px-3 py-1.5 rounded-lg">
                  <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Default</Text>
                </View>
              </View>

              <View className="bg-white rounded-[32px] p-5 flex-row items-center gap-4" style={elevation.card}>
                <View className="w-12 h-8 bg-slate-800 rounded items-center justify-center">
                  <Text className="text-white font-bold text-xs">Pay</Text>
                </View>
                <View>
                  <Text className="font-bold text-sm text-slate-800">Apple Pay</Text>
                  <Text className="text-[10px] text-slate-500 font-medium">Connected</Text>
                </View>
              </View>

              <AppPressable className="w-full bg-slate-50 rounded-[32px] p-5 flex-row items-center justify-center gap-2" style={elevation.well}>
                <Plus size={20} color="#475569" />
                <Text className="text-slate-600 font-bold">Add Payment Method</Text>
              </AppPressable>
            </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        )}

        {activeView === 'settings' && (
          <Animated.View entering={SlideInRight} exiting={pageExit} style={StyleSheet.absoluteFill}>
            <GestureDetector gesture={contentGesture}>
            <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 gap-6" style={elevation.card}>
                <SettingsRow title="Push Notifications" desc="Alerts for offers & rewards" on />
                <SettingsRow title="Location Services" desc="Find nearby stores & deals" on />
                <SettingsRow title="Email Newsletters" desc="Weekly recipes & specials" on={false} />
                <View className="pt-6">
                  <SettingsRow title="Dark Mode" desc="Match system settings" on={false} />
                </View>
              </View>
            </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        )}

        {activeView === 'help' && (
          <Animated.View entering={SlideInRight} exiting={pageExit} style={StyleSheet.absoluteFill}>
            <GestureDetector gesture={contentGesture}>
            <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 items-center" style={elevation.card}>
                <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mb-4">
                  <HelpCircle size={32} color="#2563eb" />
                </View>
                <Text className="text-lg font-bold text-slate-800 mb-2">How can we help?</Text>
                <Text className="text-sm text-slate-500 mb-6 text-center">Our support team is available Mon-Fri, 9am-6pm.</Text>
                <AppPressable className="w-full bg-blue-600 rounded-2xl py-4 items-center" style={glow('21, 93, 252')}>
                  <Text className="text-white font-bold">Contact Support</Text>
                </AppPressable>
              </View>

              <View className="bg-white rounded-[32px] p-2" style={elevation.card}>
                <ProfileMenuRow icon={HelpCircle} title="FAQ" color="#334155" bg="bg-slate-50" />
                <ProfileMenuRow icon={HelpCircle} title="Terms of Service" color="#334155" bg="bg-slate-50" />
                <ProfileMenuRow icon={HelpCircle} title="Privacy Policy" color="#334155" bg="bg-slate-50" />
              </View>
            </Animated.ScrollView>
            </GestureDetector>
          </Animated.View>
        )}
        {/* Left-edge strip that owns the back swipe, kept apart from the page's scroll gesture. */}
        {activeView !== 'main' ? (
          <GestureDetector gesture={edgeBackGesture}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, zIndex: 30 }} />
          </GestureDetector>
        ) : null}
      </Animated.View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
