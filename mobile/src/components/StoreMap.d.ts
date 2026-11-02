import type { Store } from '../types';

export function StoreMap(props: {
  src: string;
  title: string;
  selectedStore?: Store;
  userLocation?: { lat: number; lng: number } | null;
}): React.JSX.Element | null;
