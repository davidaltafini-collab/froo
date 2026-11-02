import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useDragControls } from 'motion/react';
import type { PanInfo } from 'motion/react';

export function useVerticalDismissDrag(onClose: () => void) {
  const dragControls = useDragControls();

  const startVerticalDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      dragControls.start(event.nativeEvent);
    },
    [dragControls],
  );

  const finishVerticalDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 96 || info.velocity.y > 800) onClose();
    },
    [onClose],
  );

  return { dragControls, startVerticalDrag, finishVerticalDrag };
}
