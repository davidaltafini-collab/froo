import React from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text as BaseText } from '../Text';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { IOSWheelPicker } from '../SharedUI';
import { AppPressable } from '../AppPressable';
import { BackdropBlur } from '../BackdropBlur';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { SheetGrabber, SHEET_GRABBER_TOP_GAP } from '../SheetGrabber';

function Text({ style, ...props }: React.ComponentProps<typeof BaseText>) {
  return <BaseText {...props} style={[style, { fontFamily: 'sans-serif' }]} />;
}

export function QtyPickerOverlay({ value, onChange, onClose }: { value: number; onChange: (v: number) => void; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const s = width / 425;
  // The Android modal is anchored to the full 921px normalized display while the
  // parity viewport ends at 849px. The extra 72px remains behind system navigation,
  // so 408px yields the web sheet's visible 336px and its measured y=513 top edge.
  const sheetHeight = 408 * s;
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: sheetHeight, onClosed: onClose });

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            backdropAnimatedStyle,
          ]}
        >
          <BackdropBlur />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.4)' }]} />
        </Animated.View>
        <AppPressable onPress={requestClose} style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            bottom: 0,
            left: 0,
            // The bottom 72 canonical pixels sit behind the Android system-navigation region.
            height: sheetHeight,
            borderTopLeftRadius: 32 * s,
            borderTopRightRadius: 32 * s,
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
          },
          surfaceAnimatedStyle,
        ]}
      >
        <GestureDetector gesture={dragGesture}>
          <View style={{ padding: 24 * s, paddingBottom: 0 }}>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: SHEET_GRABBER_TOP_GAP * s, left: 0, right: 0, alignItems: 'center' }}
            >
              <SheetGrabber scale={s} />
            </View>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 24 * s }}>
              <View style={{ width: 64 * s }} />
              <Text className="font-bold text-slate-800" style={{ fontSize: 18 * s, lineHeight: 28 * s }}>
                Quantity
              </Text>
              <AppPressable onPress={requestClose} style={{ width: 64 * s }}>
                <Text className="text-right text-green-600 font-bold" style={{ fontSize: 16 * s, lineHeight: 24 * s }}>
                  Done
                </Text>
              </AppPressable>
            </View>
          </View>
        </GestureDetector>

        <View style={{ paddingHorizontal: 56 * s, paddingBottom: 40 * s }}>
          <IOSWheelPicker value={value} onChange={onChange} max={99} scale={s} fontFamily="sans-serif" />
        </View>
      </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
