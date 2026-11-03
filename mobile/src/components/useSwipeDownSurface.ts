import React from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedScrollHandler,
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

  // Shared "let go" logic for every drag source: commit the dismiss past a distance or flick
  // velocity, otherwise settle back to fully open without overshooting the top edge.
  const settle = React.useCallback(
    (velocityY: number) => {
      'worklet';
      const shouldDismiss =
        translateY.value > closedOffset * dismissDistanceRatio || velocityY > DISMISS_VELOCITY;

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
    },
    [closedOffset, closing, dismissDistanceRatio, onClosed, translateY],
  );

  // --- iOS-style "drag the whole sheet" ------------------------------------------------------
  // The sheet's scroll content tracks its own offset. While it is scrolled to the very top, a
  // downward pull anywhere on the content moves the sheet instead of the list (exactly how iOS
  // sheets behave); once the list is scrolled, the same gesture just scrolls it.
  const scrollY = useSharedValue(0);
  const contentDragging = useSharedValue(false);
  const contentAnchorY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentGesture = React.useMemo(() => {
    const nativeScroll = Gesture.Native();
    const pan = Gesture.Pan()
      .maxPointers(1)
      .activeOffsetY([-6, 6])
      .failOffsetX([-24, 24])
      .onStart(() => {
        contentDragging.value = false;
      })
      .onUpdate((event) => {
        if (closing.value) return;
        if (!contentDragging.value) {
          if (scrollY.value > 1 || event.translationY <= 0) return;
          contentDragging.value = true;
          contentAnchorY.value = event.translationY;
          cancelAnimation(translateY);
          dragOriginY.value = translateY.value;
        }
        const next = dragOriginY.value + (event.translationY - contentAnchorY.value);
        translateY.value = next < 0 ? 0 : next;
      })
      .onEnd((event) => {
        if (!contentDragging.value) return;
        contentDragging.value = false;
        settle(event.velocityY);
      })
      .onFinalize(() => {
        if (!contentDragging.value) return;
        contentDragging.value = false;
        settle(0);
      });
    return Gesture.Simultaneous(pan, nativeScroll);
  }, [closing, contentAnchorY, contentDragging, dragOriginY, scrollY, settle, translateY]);

  /** Props for the sheet's Animated.ScrollView so it reports its offset and never rubber-bands
   *  at the top (the pull goes to the sheet instead, like iOS). */
  /** Call when the sheet swaps its scroll content (e.g. a pushed sub-page) so a stale offset
   *  from the previous page cannot block the pull-to-dismiss. */
  const resetScroll = React.useCallback(() => {
    scrollY.value = 0;
  }, [scrollY]);

  const scrollProps = {
    onScroll: scrollHandler,
    scrollEventThrottle: 16,
    bounces: false,
    overScrollMode: 'never' as const,
  };

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
          settle(event.velocityY);
        }),
    [dragOriginY, settle, translateY],
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
    /** Pan for a non-scrolling region (header, or the whole sheet when nothing in it scrolls). */
    dragGesture,
    /** Wrap the sheet's Animated.ScrollView in a GestureDetector with this, and spread scrollProps on it. */
    contentGesture,
    scrollProps,
    resetScroll,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  };
}
