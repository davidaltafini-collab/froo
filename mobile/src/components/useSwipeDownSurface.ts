import React from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const OPEN_DURATION_MS = 260;
const CLOSE_DURATION_MS = 210;
const DISMISS_VELOCITY = 850;

const drawerOpenEasing = Easing.bezier(0.32, 0.72, 0, 1);
const drawerCloseEasing = Easing.bezier(0.32, 0, 0.67, 0);

type SwipeDownSurfaceOptions = {
  closedOffset: number;
  onClosed: () => void;
  dismissDistanceRatio?: number;
};

/**
 * Shared motion contract for native bottom sheets.
 *
 * Entrances and committed exits use timing curves so a surface cannot travel past its
 * final resting edge. A clamped spring is reserved for the interruptible "return to open"
 * case after an incomplete drag.
 */
export function useSwipeDownSurface({
  closedOffset,
  onClosed,
  dismissDistanceRatio = 0.22,
}: SwipeDownSurfaceOptions) {
  const translateY = useSharedValue(closedOffset);
  const dragOriginY = useSharedValue(0);
  const closing = useSharedValue(false);

  React.useEffect(() => {
    closing.value = false;
    translateY.value = closedOffset;
    translateY.value = withTiming(0, {
      duration: OPEN_DURATION_MS,
      easing: drawerOpenEasing,
    });
  }, [closedOffset, closing, translateY]);

  const requestClose = React.useCallback(() => {
    if (closing.value) return;
    closing.value = true;
    cancelAnimation(translateY);
    translateY.value = withTiming(
      closedOffset,
      { duration: CLOSE_DURATION_MS, easing: drawerCloseEasing },
      (finished) => {
        if (finished) runOnJS(onClosed)();
      },
    );
  }, [closedOffset, closing, onClosed, translateY]);

  const dragGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY(8)
        .failOffsetX([-24, 24])
        .onBegin(() => {
          cancelAnimation(translateY);
          dragOriginY.value = translateY.value;
        })
        .onUpdate((event) => {
          const next = dragOriginY.value + event.translationY;
          // Upward travel is deliberately resisted so the sheet never springs out of frame.
          translateY.value = next < 0 ? next * 0.08 : next;
        })
        .onEnd((event) => {
          const shouldDismiss =
            translateY.value > closedOffset * dismissDistanceRatio ||
            event.velocityY > DISMISS_VELOCITY;

          if (shouldDismiss) {
            closing.value = true;
            translateY.value = withTiming(
              closedOffset,
              { duration: CLOSE_DURATION_MS, easing: drawerCloseEasing },
              (finished) => {
                if (finished) runOnJS(onClosed)();
              },
            );
            return;
          }

          translateY.value = withSpring(0, {
            damping: 32,
            stiffness: 320,
            mass: 0.75,
            overshootClamping: true,
            energyThreshold: 0.001,
          });
        }),
    [closedOffset, closing, dismissDistanceRatio, dragOriginY, onClosed, translateY],
  );

  const surfaceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity:
      closedOffset > 0
        ? 1 - Math.min(1, Math.max(0, translateY.value / closedOffset))
        : 1,
  }));

  return {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  };
}
