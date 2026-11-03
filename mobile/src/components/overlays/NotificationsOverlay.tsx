import { Modal, ScrollView, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from '../Text';
import Animated, { Easing, SlideInRight } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { AppPressable } from '../AppPressable';
import { elevation } from '../../theme/elevation';
import { useSwipeBackPage } from '../useSwipeBackPage';

export function NotificationsOverlay({ onClose }: { onClose: () => void }) {
  const { notifications, setNotifications } = useAppContext();
  const swipeBack = useSwipeBackPage(onClose);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        entering={SlideInRight.duration(260).easing(Easing.bezier(0.32, 0.72, 0, 1))}
        exiting={swipeBack.exiting}
        style={{ flex: 1 }}
      >
      {/* Swipe right anywhere to go back, like a pushed iOS page. */}
      <GestureDetector gesture={swipeBack.gesture}>
      <Animated.View
        style={[elevation.floating, {
          flex: 1,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
        }, swipeBack.pageStyle]}
      >
      <View className="px-6 pt-12 pb-4 flex-row justify-between items-center bg-white">
        <Text className="font-bold text-slate-800 tracking-wide text-lg">Notifications</Text>
        <View className="flex-row items-center gap-3">
          <AppPressable onPress={markAllRead}>
            <Text className="text-xs font-bold text-green-600 uppercase tracking-widest">Mark All Read</Text>
          </AppPressable>
          <AppPressable onPress={onClose} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
            <X size={20} color="#64748b" />
          </AppPressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <View
              key={n.id}
              className={`p-4 rounded-[24px] flex-row gap-4 ${n.unread ? 'bg-white' : 'bg-slate-50/50 opacity-80'}`} style={elevation.card}
            >
              <View className={`w-12 h-12 rounded-full items-center justify-center ${n.unread ? 'bg-green-100' : 'bg-slate-200'}`}>
                <Icon size={24} color={n.unread ? '#16a34a' : '#64748b'} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className={`font-bold text-sm flex-1 pr-2 ${n.unread ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</Text>
                  {n.unread && <View className="w-2 h-2 rounded-full bg-green-500 mt-1" />}
                </View>
                <Text className="text-xs text-slate-500 leading-relaxed mb-2 pr-4">{n.message}</Text>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{n.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      </Animated.View>
      </GestureDetector>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
