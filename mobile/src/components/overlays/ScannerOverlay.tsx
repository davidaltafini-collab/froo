import React from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../Text';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScanLine, X } from 'lucide-react-native';
import { AppPressable } from '../AppPressable';
import { BackdropBlur } from '../BackdropBlur';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { SheetGrabber } from '../SheetGrabber';

function ScanReticle() {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1250 }), -1, true);
  }, [progress]);
  const style = useAnimatedStyle(() => ({ top: `${progress.value * 100}%` }));

  return (
    <View pointerEvents="none" className="absolute inset-0 z-10 items-center justify-center">
      <View className="w-[70%] aspect-square max-w-[280px] relative">
        <View
          className="absolute inset-0 rounded-[32px] border border-white/20"
          style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
        />
        <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-[32px]" />
        <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-[32px]" />
        <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-[32px]" />
        <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-[32px]" />
        <Animated.View style={[{ position: 'absolute', left: 24, right: 24, height: 2, backgroundColor: '#22c55e' }, style]} />
      </View>
    </View>
  );
}

export function ScannerOverlay({ onClose }: { onClose: () => void }) {
  const { height } = useWindowDimensions();
  const sheetHeight = height * 0.8;
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: sheetHeight, onClosed: onClose });
  const [permission, requestPermission] = useCameraPermissions();
  const [minimumRequestTimeElapsed, setMinimumRequestTimeElapsed] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setMinimumRequestTimeElapsed(true), 1200);
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    if (!permission || (!permission.granted && permission.canAskAgain)) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(15,23,42,0.4)' },
            backdropAnimatedStyle,
          ]}
        >
          <BackdropBlur />
        </Animated.View>
        <AppPressable onPress={requestClose} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            {
              height: sheetHeight,
              width: '100%',
              padding: 24,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderWidth: 1,
              borderColor: '#f1f5f9',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
            },
            surfaceAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={dragGesture}>
            <View style={{ marginHorizontal: -24, paddingHorizontal: 24, paddingBottom: 12 }}>
              <View style={{ alignSelf: 'center', marginBottom: 5 }}>
                <SheetGrabber />
              </View>
            </View>
          </GestureDetector>

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-slate-800">Scanner</Text>
          <AppPressable onPress={requestClose} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
            <X size={20} color="#64748b" />
          </AppPressable>
        </View>

          <View className="flex-1 relative items-center justify-center bg-slate-900 rounded-[32px] overflow-hidden mb-6">
          {!permission?.granted && !minimumRequestTimeElapsed ? (
            <Text className="text-white/70 text-sm">Requesting camera access...</Text>
          ) : !permission?.granted ? (
            <View className="items-center p-8">
              <ScanLine size={48} color="rgba(255,255,255,0.5)" style={{ marginBottom: 16 }} />
              <Text className="font-bold mb-2 text-white text-center">Camera Access Required</Text>
              <Text className="text-sm text-white/70 text-center">Please enable camera permissions to use the scanner.</Text>
            </View>
          ) : (
            <>
              <CameraView style={{ position: 'absolute', width: '100%', height: '100%' }} facing="back" />
              <ScanReticle />
            </>
          )}
          </View>

        <View className="items-center pb-2">
          <Text className="text-slate-500 text-sm font-medium text-center">
            Point your camera at a barcode to add to your list, or scan a store QR code.
          </Text>
        </View>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
