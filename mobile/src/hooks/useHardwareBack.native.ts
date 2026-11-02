import React from 'react';
import { BackHandler } from 'react-native';

export function useHardwareBack(handler: () => boolean) {
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
  }, [handler]);
}
