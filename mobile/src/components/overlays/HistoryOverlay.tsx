import React from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '../Text';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChevronRight, ReceiptText, Search, X } from 'lucide-react-native';
import { TRANSACTIONS } from '../../data/mockData';
import { AppPressable } from '../AppPressable';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { elevation } from '../../theme/elevation';

export function HistoryOverlay({ onClose }: { onClose: () => void }) {
  const { height } = useWindowDimensions();
  const [query, setQuery] = React.useState('');
  const { requestClose, dragGesture, surfaceAnimatedStyle, contentGesture, scrollProps } = useSwipeDownSurface({
    closedOffset: height,
    onClosed: onClose,
    dismissDistanceRatio: 0.16,
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTransactions = normalizedQuery
    ? TRANSACTIONS.filter((tx) => [tx.store, tx.date, tx.amount, tx.points].some((value) => value.toLowerCase().includes(normalizedQuery)))
    : TRANSACTIONS;

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={[elevation.floating,
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            borderRadius: 28,
            backgroundColor: '#f8fafc',
          },
          surfaceAnimatedStyle,
        ]}
      >
      <GestureDetector gesture={dragGesture}>
        <View className="px-6 pt-12 pb-4 bg-white flex-row justify-between items-center">
          <Text className="text-xl font-bold text-slate-800">Purchase History</Text>
          <AppPressable onPress={requestClose} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
            <X size={20} color="#64748b" />
          </AppPressable>
        </View>
      </GestureDetector>

      <GestureDetector gesture={contentGesture}>
      <Animated.ScrollView {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View className="relative justify-center mb-2">
          <View style={{ position: 'absolute', left: 20, zIndex: 10 }}>
            <Search size={20} color="#94a3b8" />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by store or date..."
            className="w-full bg-white rounded-2xl pl-14 pr-5 py-4 text-sm font-medium text-slate-800" style={elevation.card}
          />
        </View>

        {filteredTransactions.map((tx) => (
          <AppPressable key={tx.id} className="w-full bg-white rounded-2xl p-5 flex-row items-center gap-4" style={elevation.card}>
            <View className="w-12 h-12 bg-slate-50 rounded-xl items-center justify-center">
              <ReceiptText size={24} color="#94a3b8" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800" numberOfLines={1}>{tx.store}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">{tx.date}</Text>
            </View>
            <View className="items-end">
              <Text className="font-bold text-slate-800">{tx.amount}</Text>
              <Text className="text-xs font-bold text-green-600 mt-0.5">{tx.points} pts</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </AppPressable>
        ))}

        {filteredTransactions.length === 0 && (
          <View className="bg-white rounded-2xl p-6 items-center" style={elevation.card}>
            <Text className="text-sm font-bold text-slate-500">No purchases found</Text>
            <Text className="text-xs text-slate-400 mt-1">Try another store, date, or amount.</Text>
          </View>
        )}
      </Animated.ScrollView>
      </GestureDetector>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
