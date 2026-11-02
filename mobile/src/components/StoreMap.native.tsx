import React from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { Store } from '../types';

type UserLocation = { lat: number; lng: number };

interface StoreMapProps {
  src: string;
  title: string;
  selectedStore?: Store;
  userLocation?: UserLocation | null;
}

function regionFor(store: Store): Region {
  return {
    latitude: store.lat,
    longitude: store.lng,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };
}

/**
 * A genuine native map for iOS/Android. The old WebView loaded Google's iframe-only embed URL as
 * a normal page, so Google correctly rejected it. The web adapter remains an iframe; native uses
 * the platform map while keeping the same selected-store camera behaviour.
 */
export function StoreMap({ title, selectedStore, userLocation }: StoreMapProps) {
  const mapRef = React.useRef<MapView>(null);

  React.useEffect(() => {
    if (!selectedStore) return;
    mapRef.current?.animateToRegion(regionFor(selectedStore), 300);
  }, [selectedStore]);

  if (!selectedStore) return null;

  return (
    <MapView
      ref={mapRef}
      accessibilityLabel={title}
      initialRegion={regionFor(selectedStore)}
      loadingEnabled
      loadingBackgroundColor="#f1f5f9"
      loadingIndicatorColor="#16a34a"
      mapType="standard"
      pitchEnabled={false}
      rotateEnabled={false}
      showsCompass={false}
      showsMyLocationButton={false}
      showsUserLocation={Boolean(userLocation)}
      toolbarEnabled={false}
      style={{ flex: 1 }}
    >
      <Marker
        coordinate={{ latitude: selectedStore.lat, longitude: selectedStore.lng }}
        title={selectedStore.name}
        description={selectedStore.address}
      />
    </MapView>
  );
}
