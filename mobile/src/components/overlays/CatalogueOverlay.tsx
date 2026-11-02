import React from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text as BaseText } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Check, X } from 'lucide-react-native';
import { CATALOGUE_ITEMS } from '../../data/mockData';
import { AppPressable } from '../AppPressable';
import { BackdropBlur } from '../BackdropBlur';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { SheetGrabber, SHEET_GRABBER_TOP_GAP } from '../SheetGrabber';

function Text({ style, ...props }: React.ComponentProps<typeof BaseText>) {
  return <BaseText {...props} style={[style, { fontFamily: 'sans-serif' }]} />;
}

export function CatalogueOverlay({ onClose, onAdd }: { onClose: () => void; onAdd: (item: string, qty: number) => void }) {
  const { width } = useWindowDimensions();
  const s = width / 425;
  const [qtySelected, setQtySelected] = React.useState<Record<string, number>>({});
  const [addedToast, setAddedToast] = React.useState<string | null>(null);
  const sheetHeight = 760 * s;
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: sheetHeight, onClosed: onClose });

  const handleAdd = (itemName: string) => {
    const q = qtySelected[itemName] || 1;
    onAdd(itemName, q);
    setQtySelected((prev) => ({ ...prev, [itemName]: 1 }));
    setAddedToast(itemName);
    setTimeout(() => setAddedToast(null), 2000);
  };

  const updateQty = (itemName: string, delta: number) => {
    setQtySelected((prev) => ({ ...prev, [itemName]: Math.max(1, (prev[itemName] || 1) + delta) }));
  };

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}
        >
          <BackdropBlur />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.6)' }]} />
        </Animated.View>
        <AppPressable onPress={requestClose} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 0,
              // The web's 90vh sheet begins behind the frozen shell header. This height places the
              // first visible native row at the same 123px boundary on the acceptance capture.
              height: sheetHeight,
              borderTopLeftRadius: 32 * s,
              borderTopRightRadius: 32 * s,
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
            },
            surfaceAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={dragGesture}>
            <View
              className="bg-white"
              style={{
                // Room for the grabber above the title: gap + artwork + the same gap below.
                paddingTop: (SHEET_GRABBER_TOP_GAP * 2 + 13) * s,
                paddingHorizontal: 24 * s,
                paddingBottom: 16 * s,
                borderBottomWidth: 1 * s,
                borderBottomColor: '#f1f5f9',
                zIndex: 10,
              }}
            >
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: SHEET_GRABBER_TOP_GAP * s, left: 0, right: 0, alignItems: 'center' }}
            >
              <SheetGrabber scale={s} />
            </View>
            <View className="flex-row items-center justify-between">
              <Text
                className="font-bold text-slate-900"
                style={{ fontSize: 24 * s, lineHeight: 32 * s, letterSpacing: -0.6 * s }}
              >
                Catalogue
              </Text>
              <AppPressable
                onPress={requestClose}
                className="bg-slate-100 items-center justify-center"
                style={{ width: 40 * s, height: 40 * s, borderRadius: 20 * s }}
              >
                <X size={20 * s} color="#64748b" />
              </AppPressable>
            </View>

            {addedToast ? (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="absolute bg-slate-900 flex-row items-center justify-center"
                style={{
                  top: 96 * s,
                  left: 24 * s,
                  right: 24 * s,
                  padding: 12 * s,
                  borderRadius: 12 * s,
                  gap: 8 * s,
                  zIndex: 50,
                }}
              >
                <Check size={16 * s} color="#4ade80" />
                <Text className="text-white font-bold" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                  Added {addedToast} to list
                </Text>
              </Animated.View>
            ) : null}
            </View>
          </GestureDetector>

          <ScrollView
            className="flex-1 bg-slate-50/50"
            contentContainerStyle={{ padding: 24 * s, paddingBottom: 114 * s }}
            showsVerticalScrollIndicator={false}
          >
            {CATALOGUE_ITEMS.map((category) => (
              <View key={category.id} style={{ marginBottom: 32 * s }}>
                <View className="flex-row items-center" style={{ gap: 16 * s, marginBottom: 16 * s }}>
                  <Text className="font-bold text-slate-800" style={{ fontSize: 18 * s, lineHeight: 28 * s }}>
                    {category.name}
                  </Text>
                  <View className="flex-1" style={{ height: 1 * s, backgroundColor: '#e2e8f0' }} />
                </View>
                <View style={{ gap: 12 * s }}>
                  {category.items.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row bg-white items-center shadow-sm"
                      style={{
                        gap: 16 * s,
                        padding: 16 * s,
                        borderRadius: 16 * s,
                        borderWidth: 1 * s,
                        borderColor: '#f1f5f9',
                      }}
                    >
                      <View
                        className="overflow-hidden bg-slate-100"
                        style={{
                          width: 64 * s,
                          height: 64 * s,
                          borderRadius: 12 * s,
                          borderWidth: 1 * s,
                          borderColor: '#f1f5f9',
                        }}
                      >
                        <ExpoImage source={{ uri: item.img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-bold text-slate-800"
                          style={{ marginBottom: 2 * s, fontSize: 14 * s, lineHeight: 20 * s }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View className="flex-row items-center" style={{ gap: 8 * s }}>
                          <Text className="font-black text-slate-900" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                            ${item.price.toFixed(2)}
                          </Text>
                          <Text
                            className="font-bold text-slate-400 uppercase"
                            style={{ fontSize: 10 * s, lineHeight: 15 * s, letterSpacing: 0.5 * s }}
                          >
                            {item.unit}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 * s }}>
                        <View
                          className="flex-row items-center bg-slate-50"
                          style={{ height: 32 * s, borderRadius: 8 * s, borderWidth: 1 * s, borderColor: '#e2e8f0' }}
                        >
                          <AppPressable
                            onPress={() => updateQty(item.name, -1)}
                            className="h-full items-center justify-center"
                            style={{ width: 28 * s }}
                          >
                            <Text className="text-slate-500" style={{ fontSize: 16 * s, lineHeight: 24 * s }}>-</Text>
                          </AppPressable>
                          <Text
                            className="text-center font-bold text-slate-700"
                            style={{ width: 24 * s, fontSize: 11 * s, lineHeight: 16.5 * s }}
                          >
                            {qtySelected[item.name] || 1}
                          </Text>
                          <AppPressable
                            onPress={() => updateQty(item.name, 1)}
                            className="h-full items-center justify-center"
                            style={{ width: 28 * s }}
                          >
                            <Text className="text-slate-500" style={{ fontSize: 16 * s, lineHeight: 24 * s }}>+</Text>
                          </AppPressable>
                        </View>
                        <AppPressable
                          onPress={() => handleAdd(item.name)}
                          className="bg-green-600 items-center justify-center"
                          style={{ height: 32 * s, width: 80 * s, borderRadius: 8 * s, boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
                        >
                          <Text className="text-white font-bold" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>Add</Text>
                        </AppPressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
