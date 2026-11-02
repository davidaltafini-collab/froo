import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text as BaseText, TextInput as BaseTextInput } from '../components/Text';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Check, Clock, Plus, Share2, ShoppingBag, User, Users } from 'lucide-react-native';
import { CatalogueOverlay, QtyPickerOverlay, ShareOverlay } from '../components/overlays';
import { AppPressable } from '../components/AppPressable';
import type { ShoppingListHistoryEntry, ShoppingListItem } from '../types';
import mascotFloatImg from '../../assets/brand/mascot-list-float.png';

function Text({ style, ...props }: React.ComponentProps<typeof BaseText>) {
  return <BaseText {...props} style={[style, { fontFamily: 'sans-serif' }]} />;
}

function TextInput({ style, ...props }: React.ComponentProps<typeof BaseTextInput>) {
  return <BaseTextInput {...props} style={[style, { fontFamily: 'sans-serif' }]} />;
}

function listItemEntering(index: number, designScale: number) {
  return () => {
    'worklet';
    const delay = Math.min(index * 50, 300);
    const timing = { duration: 300, easing: Easing.out(Easing.ease) };
    return {
      initialValues: { opacity: 0, transform: [{ translateY: 10 * designScale }, { scale: 0.95 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, timing)),
        transform: [
          { translateY: withDelay(delay, withTiming(0, timing)) },
          { scale: withDelay(delay, withTiming(1, timing)) },
        ],
      },
    };
  };
}

const listItemExiting = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: 200 }),
      transform: [{ scale: withTiming(0.9, { duration: 200 }) }],
    },
  };
};

export function ListView() {
  const { width: windowWidth } = useWindowDimensions();
  const designScale = windowWidth / 425;
  const s = designScale;
  const shouldReduceMotion = useReducedMotion();
  const [rootHeight, setRootHeight] = React.useState(780 * designScale);
  const [lists, setLists] = React.useState<Record<string, ShoppingListItem[]>>({
    personal: [
      { id: 1, text: 'Organic Bananas (Bunch)', checked: false, qty: 1 },
      { id: 2, text: 'Almond Milk (Unsweetened)', checked: true, qty: 2 },
      { id: 3, text: 'Sourdough Bread', checked: false, qty: 1 },
      { id: 4, text: 'Avocados (3 pack)', checked: false, qty: 1 },
      { id: 5, text: 'Free-range Eggs (Dozen)', checked: true, qty: 1 },
    ],
    family: [
      { id: 6, text: 'Paper Towels', checked: false, qty: 1 },
      { id: 7, text: 'Dish Soap', checked: true, qty: 1 },
      { id: 8, text: 'Laundry Detergent', checked: false, qty: 2 },
    ],
  });

  const [history, setHistory] = React.useState<ShoppingListHistoryEntry[]>([
    { id: 101, date: 'Oct 20, 2026', items: [{ text: 'Apples', qty: 4 }, { text: 'Chicken Breast', qty: 2 }, { text: 'Rice', qty: 1 }] },
    { id: 102, date: 'Oct 12, 2026', items: [{ text: 'Coffee Beans', qty: 1 }, { text: 'Almond Milk', qty: 2 }] },
  ]);

  const [activeList, setActiveList] = React.useState<string>('personal');
  // Fades the mascot with the tab instead of unmounting it: an unmount/remount re-fires
  // `entering` on every switch back to Personal, which read as the mascot jumping on its own.
  // This is the *only* thing driving its opacity/scale — layering a reanimated `entering` prop
  // on top of this useAnimatedStyle made the two fight over the same frames, which is what
  // stalled the fade-in and made it look like it took seconds and glitched on the way out.
  const mascotVisible = useSharedValue(0);
  React.useEffect(() => {
    mascotVisible.value = withTiming(activeList === 'personal' ? 1 : 0, {
      duration: shouldReduceMotion ? 0 : 140,
    });
  }, [activeList, shouldReduceMotion, mascotVisible]);
  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mascotVisible.value,
    transform: [{ scale: 0.96 + mascotVisible.value * 0.04 }],
  }));
  const [newItemText, setNewItemText] = React.useState('');
  const [newItemQty, setNewItemQty] = React.useState(1);
  const [showCatalogue, setShowCatalogue] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showQtyModal, setShowQtyModal] = React.useState(false);

  const toggleItem = (id: number) => {
    if (activeList === 'history') return;
    setLists((prev) => ({
      ...prev,
      [activeList]: prev[activeList].map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    }));
  };

  const addItem = (text: string, qty: number = 1) => {
    const listToUpdate = activeList === 'history' ? 'personal' : activeList;
    setLists((prev) => ({
      ...prev,
      [listToUpdate]: [{ id: Date.now() + Math.random(), text, checked: false, qty }, ...prev[listToUpdate]],
    }));
    setNewItemText('');
  };

  const handleDone = () => {
    if (lists[activeList] && lists[activeList].length > 0) {
      const newHistory = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: lists[activeList].map((i) => ({ text: i.text, qty: i.qty })),
      };
      setHistory([newHistory, ...history]);
      setLists((prev) => ({ ...prev, [activeList]: [] }));
    }
  };

  const handleRestoreHistory = (h: ShoppingListHistoryEntry) => {
    setLists((prev) => ({
      ...prev,
      personal: [
        ...h.items.map((i) => ({ id: Date.now() + Math.random(), text: i.text, checked: false, qty: i.qty })),
        ...prev.personal,
      ],
    }));
    setActiveList('personal');
  };

  const currentItems = lists[activeList] || [];

  return (
    <View
      className="relative"
      style={{ padding: 24 * s }}
      onLayout={(event) => {
        const nextHeight = event.nativeEvent.layout.height;
        setRootHeight((currentHeight) => Math.abs(currentHeight - nextHeight) > 0.5 ? nextHeight : currentHeight);
      }}
    >
      <View className="relative z-10">
        <View className="flex-row items-center justify-between" style={{ marginBottom: 24 * s }}>
          <Text
            className="font-bold text-slate-800"
            style={{ fontSize: 20 * s, lineHeight: 28 * s }}
          >
            Shopping Lists
          </Text>
          {activeList !== 'history' ? (
            <AppPressable
              onPress={() => setShowShareModal(true)}
              className="flex-row items-center bg-slate-50"
              style={{ gap: 8 * s, paddingHorizontal: 12 * s, paddingVertical: 8 * s, borderRadius: 12 * s }}
            >
              <Share2 size={16 * s} color="#475569" />
              <Text
                className="text-slate-600 font-bold uppercase"
                style={{ fontSize: 12 * s, lineHeight: 16 * s, letterSpacing: 0.6 * s }}
              >
                Share
              </Text>
            </AppPressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 * s, paddingBottom: 16 * s }}
        >
          <AppPressable
            onPress={() => setActiveList('history')}
            className="shrink-0 items-center justify-center shadow-sm"
            style={{
              width: 40 * s,
              height: 40 * s,
              borderRadius: 16 * s,
              borderWidth: activeList === 'history' ? 0 : 1 * s,
              borderColor: '#f1f5f9',
              backgroundColor: activeList === 'history' ? '#1e293b' : '#ffffff',
            }}
          >
            <Clock size={16 * s} color={activeList === 'history' ? '#ffffff' : '#475569'} />
          </AppPressable>
          <View style={{ width: 1 * s, height: 40 * s, backgroundColor: '#e2e8f0' }} />
          <AppPressable
            onPress={() => setActiveList('personal')}
            className="shadow-sm flex-row items-center"
            style={{
              gap: 8 * s,
              paddingHorizontal: 20 * s,
              paddingVertical: 10 * s,
              borderRadius: 16 * s,
              borderWidth: activeList === 'personal' ? 0 : 1 * s,
              borderColor: '#f1f5f9',
              backgroundColor: activeList === 'personal' ? '#16a34a' : '#ffffff',
            }}
          >
            <User size={14 * s} color={activeList === 'personal' ? '#ffffff' : '#475569'} />
            <Text
              className="font-bold uppercase"
              style={{
                color: activeList === 'personal' ? '#ffffff' : '#475569',
                fontSize: 11 * s,
                lineHeight: 16.5 * s,
                letterSpacing: 0.55 * s,
              }}
            >
              My List
            </Text>
          </AppPressable>
          <AppPressable
            onPress={() => setActiveList('family')}
            className="shadow-sm flex-row items-center"
            style={{
              gap: 8 * s,
              paddingHorizontal: 20 * s,
              paddingVertical: 10 * s,
              borderRadius: 16 * s,
              borderWidth: activeList === 'family' ? 0 : 1 * s,
              borderColor: '#f1f5f9',
              backgroundColor: activeList === 'family' ? '#16a34a' : '#ffffff',
            }}
          >
            <Users size={14 * s} color={activeList === 'family' ? '#ffffff' : '#475569'} />
            <Text
              className="font-bold uppercase"
              style={{
                color: activeList === 'family' ? '#ffffff' : '#475569',
                fontSize: 11 * s,
                lineHeight: 16.5 * s,
                letterSpacing: 0.55 * s,
              }}
            >
              Family List
            </Text>
          </AppPressable>
        </ScrollView>

        {activeList !== 'history' ? (
          <>
            <View className="flex-row" style={{ gap: 12 * s, marginBottom: 16 * s, marginTop: 8 * s }}>
              <View
                className="flex-1 flex-row items-center bg-white shadow-sm overflow-hidden"
                style={{ borderWidth: 1 * s, borderColor: '#f1f5f9', borderRadius: 16 * s }}
              >
                <TextInput
                  placeholder={`Add an item to ${activeList}...`}
                  placeholderTextColor="#94a3b8"
                  value={newItemText}
                  onChangeText={setNewItemText}
                  onSubmitEditing={() => {
                    if (newItemText.trim()) {
                      addItem(newItemText.trim(), newItemQty);
                      setNewItemQty(1);
                    }
                  }}
                  className="flex-1 text-slate-800"
                  style={{
                    paddingHorizontal: 20 * s,
                    paddingVertical: 16 * s,
                    fontSize: 14 * s,
                    lineHeight: 20 * s,
                  }}
                />
                <View style={{ paddingHorizontal: 12 * s, borderLeftWidth: 1 * s, borderLeftColor: '#f1f5f9' }}>
                  <AppPressable
                    onPress={() => setShowQtyModal(true)}
                    style={{
                      paddingHorizontal: 12 * s,
                      paddingVertical: 6 * s,
                      backgroundColor: '#f8fafc',
                      borderWidth: 1 * s,
                      borderColor: '#e2e8f0',
                      borderRadius: 12 * s,
                    }}
                  >
                    <Text
                      className="text-slate-700 font-bold"
                      style={{ fontSize: 12 * s, lineHeight: 16 * s }}
                    >
                      Qty: {newItemQty}
                    </Text>
                  </AppPressable>
                </View>
              </View>
              <AppPressable
                onPress={() => {
                  if (newItemText.trim()) {
                    addItem(newItemText.trim(), newItemQty);
                    setNewItemQty(1);
                  }
                }}
                className="bg-green-600 items-center justify-center shadow-lg shadow-green-200"
                style={{ width: 56 * s, height: 56 * s, borderRadius: 16 * s }}
              >
                <Plus size={24 * s} color="#ffffff" />
              </AppPressable>
            </View>

            <AppPressable
              onPress={() => setShowCatalogue(true)}
              className="w-full bg-slate-50 flex-row items-center justify-center"
              style={{
                marginBottom: 32 * s,
                paddingVertical: 16 * s,
                borderWidth: 1 * s,
                borderColor: '#e2e8f0',
                borderStyle: 'dashed',
                borderRadius: 16 * s,
                gap: 8 * s,
              }}
            >
              <ShoppingBag size={16 * s} color="#475569" />
              <Text className="font-bold text-slate-600" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                Browse Catalogue
              </Text>
            </AppPressable>

            <View style={{ gap: 12 * s }}>
              {currentItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={listItemEntering(index, designScale)}
                  exiting={listItemExiting}
                  layout={LinearTransition.springify().damping(20).stiffness(200)}
                >
                  <AppPressable
                    onPress={() => toggleItem(item.id)}
                    className="flex-row items-center"
                    style={{
                      gap: 16 * s,
                      padding: 16 * s,
                      borderRadius: 24 * s,
                      borderWidth: 1 * s,
                      borderColor: '#f1f5f9',
                      backgroundColor: item.checked ? '#f8fafc' : '#ffffff',
                      boxShadow: item.checked ? 'none' : '0 1px 2px rgba(15,23,42,0.05)',
                    }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 28 * s,
                        height: 28 * s,
                        borderRadius: 12 * s,
                        borderWidth: 2 * s,
                        borderColor: item.checked ? '#22c55e' : '#e2e8f0',
                        backgroundColor: item.checked ? '#22c55e' : '#ffffff',
                      }}
                    >
                      {item.checked ? <Check size={16 * s} color="#ffffff" /> : null}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold"
                        style={{
                          color: item.checked ? '#94a3b8' : '#334155',
                          fontSize: 14 * s,
                          lineHeight: 20 * s,
                          textDecorationLine: item.checked ? 'line-through' : 'none',
                        }}
                        numberOfLines={1}
                      >
                        {item.text}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12 * s, paddingVertical: 4 * s, borderRadius: 8 * s }}>
                      <Text className="font-black text-slate-500" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>
                        x{item.qty}
                      </Text>
                    </View>
                  </AppPressable>
                </Animated.View>
              ))}

              {currentItems.length === 0 ? (
                <View
                  className="items-center bg-slate-50"
                  style={{
                    padding: 32 * s,
                    borderRadius: 32 * s,
                    borderWidth: 1 * s,
                    borderColor: '#f1f5f9',
                    borderStyle: 'dashed',
                  }}
                >
                  <Text className="font-bold text-slate-400" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                    List is empty
                  </Text>
                </View>
              ) : null}

              {currentItems.length > 0 ? (
                <AppPressable
                  onPress={handleDone}
                  className="w-full bg-green-600 flex-row items-center justify-center shadow-lg shadow-green-200"
                  style={{ marginTop: 24 * s, paddingVertical: 16 * s, borderRadius: 16 * s, gap: 8 * s }}
                >
                  <Check size={20 * s} color="#ffffff" />
                  <Text className="text-white font-bold" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                    Mark List as Done
                  </Text>
                </AppPressable>
              ) : null}
            </View>
          </>
        ) : (
          <View style={{ gap: 24 * s, marginTop: 16 * s }}>
            {history.map((h) => (
              <View
                key={h.id}
                className="bg-white shadow-sm"
                style={{ borderWidth: 1 * s, borderColor: '#f1f5f9', borderRadius: 24 * s, padding: 20 * s }}
              >
                <View className="flex-row items-center justify-between" style={{ marginBottom: 16 * s }}>
                  <View className="flex-row items-center" style={{ gap: 8 * s }}>
                    <Clock size={16 * s} color="#94a3b8" />
                    <Text className="font-bold text-slate-800" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                      {h.date}
                    </Text>
                  </View>
                  <AppPressable
                    onPress={() => handleRestoreHistory(h)}
                    className="flex-row items-center bg-green-50"
                    style={{ gap: 4 * s, paddingHorizontal: 12 * s, paddingVertical: 6 * s, borderRadius: 8 * s }}
                  >
                    <Plus size={12 * s} color="#16a34a" />
                    <Text
                      className="font-bold text-green-600 uppercase"
                      style={{ fontSize: 10 * s, lineHeight: 15 * s, letterSpacing: 1 * s }}
                    >
                      Restore
                    </Text>
                  </AppPressable>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 8 * s }}>
                  {h.items.map((hi, i) => (
                    <View
                      key={i}
                      className="flex-row items-center bg-slate-50"
                      style={{
                        gap: 8 * s,
                        borderWidth: 1 * s,
                        borderColor: '#f1f5f9',
                        borderRadius: 12 * s,
                        paddingHorizontal: 14 * s,
                        paddingVertical: 6 * s,
                      }}
                    >
                      <Text className="font-bold text-slate-600" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>
                        {hi.text}
                      </Text>
                      <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 6 * s, borderRadius: 6 * s }}>
                        <Text className="font-black text-slate-400" style={{ fontSize: 10 * s, lineHeight: 15 * s }}>
                          x{hi.qty}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {history.length === 0 ? (
              <View
                className="items-center bg-slate-50"
                style={{
                  padding: 32 * s,
                  borderRadius: 32 * s,
                  borderWidth: 1 * s,
                  borderColor: '#f1f5f9',
                  borderStyle: 'dashed',
                  marginTop: 16 * s,
                }}
              >
                <Text className="font-bold text-slate-400" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                  No history yet
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {showCatalogue ? (
        <CatalogueOverlay onClose={() => setShowCatalogue(false)} onAdd={(item, qty) => { addItem(item, qty); setShowCatalogue(false); }} />
      ) : null}
      {showShareModal ? <ShareOverlay onClose={() => setShowShareModal(false)} /> : null}
      {showQtyModal ? <QtyPickerOverlay value={newItemQty} onChange={setNewItemQty} onClose={() => setShowQtyModal(false)} /> : null}

      {/*
        Stays mounted across every tab — only Personal wants it visible (Family/History fade it
        out via mascotAnimatedStyle) — so switching tabs never remounts it. An unmount/remount on
        every switch re-fired `entering` each time, which read as the mascot jumping on its own.
        No `entering` prop here at all: it was a second animation system fighting this one over
        the same opacity every mount, which is what stalled the fade-in and glitched the exit.
      */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: rootHeight * 0.204,
            left: 321.06 * s,
            width: 158.2 * s,
            height: rootHeight * 0.215,
            zIndex: 20,
          },
          mascotAnimatedStyle,
        ]}
      >
        <ExpoImage
          source={mascotFloatImg}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          style={{ width: '100%', height: '100%', transform: [{ rotate: '-1.5deg' }] }}
        />
      </Animated.View>
    </View>
  );
}
