import React from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import MapView, { Marker, type Region } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import type { Store } from '../types';

type UserLocation = { lat: number; lng: number };

/**
 * Google Maps on Android aborts the whole app when no API key is in the manifest. Expo Go ships
 * its own key; standalone builds only have one when GOOGLE_MAPS_API_KEY was set at build time.
 */
const androidMapsKeyMissing =
  Platform.OS === 'android' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  !Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

function openStreetMapUrl(store: Store) {
  const d = 0.012;
  const bbox = [store.lng - d, store.lat - d, store.lng + d, store.lat + d].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${store.lat},${store.lng}`;
}

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

  if (androidMapsKeyMissing) {
    return (
      <WebView
        accessibilityLabel={title}
        source={{ uri: openStreetMapUrl(selectedStore) }}
        style={{ flex: 1, backgroundColor: '#f1f5f9' }}
        scrollEnabled={false}
      />
    );
  }

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
