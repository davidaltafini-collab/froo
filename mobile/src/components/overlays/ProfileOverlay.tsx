import React from 'react';
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from '../LinearGradient';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const { height } = useWindowDimensions();
  const [activeView, setActiveView] = React.useState<ProfileView>(initialView);
  const { requestClose, dragGesture, surfaceAnimatedStyle } = useSwipeDownSurface({
    closedOffset: height,
    onClosed: onClose,
    dismissDistanceRatio: 0.16,
  });

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
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: 1,
            borderColor: '#f1f5f9',
            borderRadius: 28,
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
          },
          surfaceAnimatedStyle,
        ]}
      >
      <GestureDetector gesture={dragGesture}>
        <View className="px-6 pt-12 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
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

      <View className="flex-1">
        {activeView === 'main' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex-row items-center gap-5">
                <View className="w-20 h-20 rounded-2xl bg-slate-200 border-4 border-green-50 items-center justify-center overflow-hidden">
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

              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
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
                    <View className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden -mr-3">
                      <ExpoImage source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&fit=crop' }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    </View>
                    <View className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <ExpoImage source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80&fit=crop' }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    </View>
                  </View>
                  <Text className="text-xs font-medium text-slate-500 flex-1">Sarah and Emma are in your family.</Text>
                </View>

                <View className="mt-5 pt-5 border-t border-slate-100 gap-4">
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
                className="rounded-[32px] p-6 shadow-sm border border-yellow-300 overflow-hidden"
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
                <AppPressable onPress={() => setActiveView('games')} className="w-full mt-5 bg-white rounded-2xl py-3 items-center shadow-md">
                  <Text className="text-orange-600 font-bold">Play Now</Text>
                </AppPressable>
              </LinearGradient>

              <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                <ProfileMenuRow icon={CreditCard} title="Payment Methods" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('payments')} />
                <ProfileMenuRow icon={Settings} title="App Settings" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('settings')} />
                <ProfileMenuRow icon={HelpCircle} title="Help & Support" color="#334155" bg="bg-slate-50" onClick={() => setActiveView('help')} />
              </View>

              <AppPressable className="w-full bg-white rounded-[32px] p-5 shadow-sm border border-red-100 flex-row items-center justify-center gap-3">
                <LogOut size={20} color="#dc2626" />
                <Text className="text-red-600 font-bold">Sign Out</Text>
              </AppPressable>
            </ScrollView>
          </Animated.View>
        )}

        {activeView === 'games' && (
          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
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

              <View className="p-2 rounded-3xl w-full max-w-[240px] shadow-inner mb-6" style={{ backgroundColor: '#f54900' }}>
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
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={StyleSheet.absoluteFill}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <View className="items-center mb-6">
                  <View>
                    <View className="w-24 h-24 rounded-2xl bg-slate-200 border-4 border-green-50 items-center justify-center overflow-hidden">
                      <UserAvatar width="100%" height="100%" />
                    </View>
                    <AppPressable className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full items-center justify-center border-2 border-white">
                      <Plus size={16} color="white" />
                    </AppPressable>
                  </View>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Full Name</Text>
                    <TextInput defaultValue="Necula David" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Email Address</Text>
                    <TextInput defaultValue="david.necula@gmail.com" keyboardType="email-address" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Phone Number</Text>
                    <TextInput defaultValue="+40 712 345 678" keyboardType="phone-pad" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800" />
                  </View>

                  <AppPressable onPress={() => setActiveView('main')} className="w-full mt-4 bg-green-600 rounded-2xl py-4 items-center shadow-md shadow-green-200">
                    <Text className="text-white font-bold">Save Changes</Text>
                  </AppPressable>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {activeView === 'family_invite' && (
          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}
          >
            <View className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 items-center max-w-sm w-full">
              <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
                <Users size={32} color="#4f46e5" />
              </View>
              <Text className="text-xl font-bold text-slate-800 mb-2">Invite Family Member</Text>
              <Text className="text-sm text-slate-500 mb-8 text-center leading-relaxed">Let them scan this code with their camera to join your family group.</Text>

              <View className="bg-white p-4 rounded-3xl border-2 border-slate-100 mb-8">
                <QrCode size={192} color="#1e293b" />
              </View>

              <View className="flex-row items-center gap-4 w-full">
                <View className="h-[1px] flex-1 bg-slate-100" />
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or send link</Text>
                <View className="h-[1px] flex-1 bg-slate-100" />
              </View>

              <AppPressable className="w-full mt-6 bg-indigo-600 rounded-2xl py-4 items-center shadow-md shadow-indigo-200 flex-row justify-center gap-2">
                <Share2 size={20} color="white" />
                <Text className="text-white font-bold">Share Invite Link</Text>
              </AppPressable>
            </View>
          </Animated.View>
        )}

        {activeView === 'payments' && (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={StyleSheet.absoluteFill}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex-row items-center justify-between">
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

              <View className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex-row items-center gap-4">
                <View className="w-12 h-8 bg-slate-800 rounded items-center justify-center">
                  <Text className="text-white font-bold text-xs">Pay</Text>
                </View>
                <View>
                  <Text className="font-bold text-sm text-slate-800">Apple Pay</Text>
                  <Text className="text-[10px] text-slate-500 font-medium">Connected</Text>
                </View>
              </View>

              <AppPressable className="w-full bg-slate-50 rounded-[32px] p-5 border-2 border-dashed border-slate-200 flex-row items-center justify-center gap-2">
                <Plus size={20} color="#475569" />
                <Text className="text-slate-600 font-bold">Add Payment Method</Text>
              </AppPressable>
            </ScrollView>
          </Animated.View>
        )}

        {activeView === 'settings' && (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={StyleSheet.absoluteFill}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 gap-6">
                <SettingsRow title="Push Notifications" desc="Alerts for offers & rewards" on />
                <SettingsRow title="Location Services" desc="Find nearby stores & deals" on />
                <SettingsRow title="Email Newsletters" desc="Weekly recipes & specials" on={false} />
                <View className="pt-6 border-t border-slate-100">
                  <SettingsRow title="Dark Mode" desc="Match system settings" on={false} />
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {activeView === 'help' && (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={StyleSheet.absoluteFill}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 items-center">
                <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mb-4">
                  <HelpCircle size={32} color="#2563eb" />
                </View>
                <Text className="text-lg font-bold text-slate-800 mb-2">How can we help?</Text>
                <Text className="text-sm text-slate-500 mb-6 text-center">Our support team is available Mon-Fri, 9am-6pm.</Text>
                <AppPressable className="w-full bg-blue-600 rounded-2xl py-4 items-center shadow-md shadow-blue-200">
                  <Text className="text-white font-bold">Contact Support</Text>
                </AppPressable>
              </View>

              <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                <ProfileMenuRow icon={HelpCircle} title="FAQ" color="#334155" bg="bg-slate-50" />
                <ProfileMenuRow icon={HelpCircle} title="Terms of Service" color="#334155" bg="bg-slate-50" />
                <ProfileMenuRow icon={HelpCircle} title="Privacy Policy" color="#334155" bg="bg-slate-50" />
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
