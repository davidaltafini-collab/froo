import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  SlideOutRight,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const CLOSE_EASING = Easing.bezier(0.32, 0, 0.67, 0);

/**
 * iOS "pushed page" back gesture for full-screen pages that slide in from the right.
 *
 * A rightward drag anywhere on the page (vertical scrolling still wins for vertical drags) moves
 * the page with the finger. Releasing past a third of the screen, or with a rightward flick,
 * finishes the slide and closes; anything less springs back. When the gesture closes the page it
 * is already off-screen, so the page's own `exiting` animation is suppressed to avoid a replay.
 */
export function useSwipeBackPage(onClose: () => void) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const [closedByGesture, setClosedByGesture] = React.useState(false);

  const finish = React.useCallback(() => {
    setClosedByGesture(true);
    requestAnimationFrame(onClose);
  }, [onClose]);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetX(12)
        .failOffsetY([-14, 14])
        .onUpdate((event) => {
          translateX.value = Math.max(0, event.translationX);
        })
        .onEnd((event) => {
          if (translateX.value > width / 3 || event.velocityX > 700) {
            translateX.value = withTiming(width, { duration: 210, easing: CLOSE_EASING }, (done) => {
              if (done) runOnJS(finish)();
            });
          } else {
            translateX.value = withSpring(0, { damping: 30, stiffness: 320, overshootClamping: true });
          }
        }),
    [finish, translateX, width],
  );

  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return {
    gesture,
    pageStyle,
    /** Pass as the page's `exiting` prop (falls back to the normal slide-out for button closes). */
    exiting: closedByGesture ? undefined : SlideOutRight.duration(210).easing(CLOSE_EASING),
  };
}
