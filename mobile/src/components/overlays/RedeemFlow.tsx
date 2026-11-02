import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Award } from 'lucide-react-native';
import { AppPressable } from '../AppPressable';
import { BackdropBlur } from '../BackdropBlur';
import type { RewardItem } from '../../types';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { SheetGrabber } from '../SheetGrabber';

export function RedeemFlow({ item, onConfirm, onCancel }: { item: RewardItem; userPoints: number; onConfirm: () => void; onCancel: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const designScale = windowWidth / 425;
  const [step, setStep] = React.useState<'confirm' | 'animating'>('confirm');
  const spin = useSharedValue(0);
  const sheetHeight = 556 * designScale;
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: sheetHeight, onClosed: onCancel });

  React.useEffect(() => {
    if (step !== 'animating') return;
    spin.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })),
      -1,
    );
  }, [step, spin]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + spin.value * 0.2 },
      { rotate: `${spin.value * 10}deg` },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      style={[
        StyleSheet.absoluteFill,
        {
          justifyContent: 'flex-end',
          overflow: 'hidden',
          zIndex: 60,
        },
      ]}
    >
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
            width: '100%',
            // The Android root extends below the 849px comparison crop into system-navigation
            // space. 556 design units places the visible top at the web sheet's measured y=363.
            height: sheetHeight,
            padding: 24 * designScale,
            paddingBottom: 24 * designScale,
            alignItems: 'center',
            borderTopLeftRadius: 32 * designScale,
            borderTopRightRadius: 32 * designScale,
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
          },
          surfaceAnimatedStyle,
        ]}
      >
      <GestureDetector gesture={dragGesture}>
        <View style={{ width: '100%', alignItems: 'center', paddingBottom: 20 * designScale }}>
          <View
            style={{ marginBottom: 5 * designScale }}
          >
            <SheetGrabber scale={designScale} />
          </View>
        </View>
      </GestureDetector>

      {step === 'confirm' ? (
        <>
          <View
            style={{
              width: 128 * designScale,
              height: 128 * designScale,
              marginBottom: 24 * designScale,
              borderRadius: 16 * designScale,
              boxShadow: '0 4px 6px -1px rgba(15,23,42,0.1)',
            }}
          >
            <ExpoImage
              source={{ uri: item.image }}
              style={{
                width: 128 * designScale,
                height: 128 * designScale,
                borderRadius: 16 * designScale,
              }}
              contentFit="cover"
            />
          </View>
          <Text
            className="font-black text-slate-900 text-center"
            style={{
              marginBottom: 8 * designScale,
              fontSize: 24 * designScale,
              lineHeight: 32 * designScale,
            }}
          >
            {item.name}
          </Text>
          <Text
            className="text-slate-500 font-medium text-center"
            style={{
              marginBottom: 32 * designScale,
              fontSize: 16 * designScale,
              lineHeight: 24 * designScale,
            }}
          >
            Are you sure you want to redeem this reward for{' '}
            <Text
              className="font-bold text-slate-800"
              style={{ fontSize: 16 * designScale, lineHeight: 24 * designScale }}
            >
              {item.cost.toLocaleString()} pts
            </Text>
            ?
          </Text>

          <AppPressable
            onPress={() => {
              setStep('animating');
              setTimeout(onConfirm, 1200);
            }}
            className="w-full items-center bg-[#17642a]"
            style={{
              borderRadius: 16 * designScale,
              paddingVertical: 16 * designScale,
              marginBottom: 12 * designScale,
            }}
          >
            <Text
              className="text-white font-black uppercase"
              style={{
                fontSize: 18 * designScale,
                lineHeight: 28 * designScale,
                letterSpacing: 0.45 * designScale,
              }}
            >
              Yes, Redeem
            </Text>
          </AppPressable>
          <AppPressable
            onPress={requestClose}
            className="w-full items-center"
            style={{ paddingVertical: 16 * designScale }}
          >
            <Text
              className="text-slate-500 font-bold uppercase"
              style={{
                fontSize: 16 * designScale,
                lineHeight: 24 * designScale,
                letterSpacing: 0.4 * designScale,
              }}
            >
              Cancel
            </Text>
          </AppPressable>
        </>
      ) : (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 48 * designScale,
          }}
        >
          <Animated.View
            style={[
              badgeStyle,
              {
                width: 80 * designScale,
                height: 80 * designScale,
                borderRadius: 40 * designScale,
                marginBottom: 24 * designScale,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            className="bg-green-100"
          >
            <Award size={40 * designScale} color="#16a34a" />
          </Animated.View>
          <Text
            className="font-black text-slate-900"
            style={{ fontSize: 20 * designScale, lineHeight: 28 * designScale }}
          >
            Activating Reward...
          </Text>
        </View>
      )}
      </Animated.View>
    </Animated.View>
  );
}
