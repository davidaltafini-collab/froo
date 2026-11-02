import React from 'react';
import { Linking, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from '../components/LinearGradient';
import * as Location from 'expo-location';
import { Clock, LocateFixed, MapPin, Navigation, Search } from 'lucide-react-native';
import { AppPressable } from '../components/AppPressable';
import type { Store } from '../types';
import { StoreMap } from '../components/StoreMap';

const FROO_STORES: Store[] = [
  { id: 'RO00001', name: 'froo Giurgiului', town: 'Bucuresti', address: 'Giurgiului 103, Bucuresti', lat: 44.39327987, lng: 26.09417162, openingHours: '6:00-23:00', active: true },
  { id: 'RO00003', name: 'froo Liviu Rebreanu 13', town: 'Bucuresti', address: 'Liviu Rebreanu 13, Bucuresti', lat: 44.42594237, lng: 26.1649737, openingHours: '7:00-22:00', active: true },
  { id: 'RO00002', name: 'froo Calea Mosilor', town: 'Bucuresti', address: 'Calea Mosilor 300, Bucuresti', lat: 44.44703816, lng: 26.12291218, openingHours: '6:00-23:00', active: true },
  { id: 'RO00005', name: 'froo Nerva Traian', town: 'Bucuresti', address: 'Nerva Traian 14, Bucuresti', lat: 44.42076279, lng: 26.11582251, openingHours: '6:00-23:00', active: true },
  { id: 'RO00009', name: 'froo 13 Septembrie', town: 'Bucuresti', address: '13 Septembrie 75-79, Bucuresti', lat: 44.4249, lng: 26.08047, openingHours: '6:00-23:00', active: true },
  { id: 'RO00007', name: 'froo Mihai Bravu', town: 'Bucuresti', address: 'Mihai Bravu 90-96, Bucuresti', lat: 44.44299, lng: 26.12926, openingHours: '6:00-23:00', active: true },
  { id: 'RO00283', name: 'froo Pipera', town: 'Bucuresti', address: 'Pipera 21-23, Bucuresti', lat: 44.47955, lng: 26.09792, openingHours: '6:00-23:00', active: true },
  { id: 'RO00276', name: 'froo Bld. Decebal', town: 'Bucuresti', address: 'Bld. Decebal 28, Bucuresti', lat: 44.43108, lng: 26.13826, openingHours: '6:00-23:00', active: true },
  { id: 'RO00290', name: 'froo Diamantului', town: 'Ilfov', address: 'Diamantului 172-176, Ilfov', lat: 44.38973, lng: 26.00477, openingHours: '6:00-23:00', active: true },
  { id: 'RO00278', name: 'froo Soarelui', town: 'Ilfov', address: 'Soarelui 23, Ilfov', lat: 44.44801, lng: 25.98021, openingHours: '6:00-23:00', active: true },
  { id: 'RO00268', name: 'froo Paris', town: 'Ploiesti', address: 'Paris 6, Ploiesti', lat: 44.94299, lng: 26.02695, openingHours: '6:00-23:00', active: true },
  { id: 'RO00282', name: 'froo Republicii', town: 'Prahova', address: 'Republicii 1E, Prahova', lat: 45.23458, lng: 25.63633, openingHours: '6:00-23:00', active: true },
];

const OFFICIAL_STORE_COUNT = 246;
const allStoresMapUrl = 'https://www.google.com/maps/search/?api=1&query=froo%20Romania';

type UserLocation = { lat: number; lng: number };

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function distanceInKm(from: UserLocation, to: Store) {
  const toRadians = (value: number) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km?: number) {
  if (km === undefined) return 'Romania';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function mapsQuery(store: Store) {
  return `${store.lat},${store.lng}`;
}

export function StoresView() {
  const [query, setQuery] = React.useState('');
  const [selectedStoreId, setSelectedStoreId] = React.useState(FROO_STORES[0].id);
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = React.useState<'idle' | 'loading' | 'denied'>('idle');
  const [searchFocused, setSearchFocused] = React.useState(false);

  const stores = React.useMemo(() => {
    const needle = normalize(query.trim());
    const filtered = FROO_STORES.filter((store) => {
      const haystack = normalize(`${store.name} ${store.address} ${store.town}`);
      return !needle || haystack.includes(needle);
    });

    return filtered
      .map((store) => ({ ...store, distanceKm: userLocation ? distanceInKm(userLocation, store) : undefined }))
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        return a.town.localeCompare(b.town) || a.name.localeCompare(b.name);
      });
  }, [query, userLocation]);

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? FROO_STORES[0];
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery(selectedStore))}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(selectedStore))}&travelmode=walking`;

  const requestLocation = async () => {
    setLocationStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocationStatus('idle');
    } catch {
      setLocationStatus('denied');
    }
  };

  return (
    <View className="p-6">
      <View className="mb-5 flex-row items-end justify-between gap-4">
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-green-700">Froo Romania</Text>
          <Text className="mt-1 text-xl font-bold text-slate-900">Nearby Stores</Text>
        </View>
        <AppPressable onPress={requestLocation} className="shrink-0 rounded-2xl border border-green-100 bg-green-50 p-3">
          <LocateFixed size={20} color="#15803d" />
        </AppPressable>
      </View>

      <View className="relative mb-4 justify-center">
        <View style={{ position: 'absolute', left: 20, zIndex: 10 }}>
          <Search size={20} color="#94a3b8" />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search city or street..."
          className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl pl-14 pr-5 py-4 text-sm font-medium text-slate-800"
          style={
            {
              borderColor: searchFocused ? '#4ade80' : '#f1f5f9',
              boxShadow: searchFocused ? '0 0 0 1px #4ade80' : '0 1px 2px rgba(15,23,42,0.05)',
              outlineStyle: 'none',
            } as never
          }
        />
      </View>

      <View className="mb-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
        <View className="relative h-56 bg-slate-100">
          <StoreMap
            src={mapSrc}
            title={`Google map for ${selectedStore.name}`}
            selectedStore={selectedStore}
            userLocation={userLocation}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', '#ffffff']}
            className="absolute bottom-0 left-0 right-0 h-16"
          />
        </View>
        <View className="flex-row items-center justify-between gap-4 p-4">
          <View className="min-w-0 flex-1">
            <Text className="truncate text-sm font-bold text-slate-900" numberOfLines={1}>{selectedStore.name}</Text>
            <Text className="mt-1 truncate text-xs font-medium text-slate-500" numberOfLines={1}>{selectedStore.address}</Text>
          </View>
          <AppPressable
            onPress={() => Linking.openURL(directionsUrl)}
            className="flex-shrink-0 flex-row items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 shadow-lg shadow-green-200"
          >
            <Navigation size={16} color="white" />
            <Text className="text-xs font-bold text-white">Directions</Text>
          </AppPressable>
        </View>
      </View>

      <View className="mb-4 flex-row items-center justify-between gap-3">
        <Text className="text-xs font-bold text-slate-500">{stores.length} matching locations</Text>
        <Text className="text-xs font-bold text-slate-500">
          {locationStatus === 'loading' ? 'Finding you...' : userLocation ? 'Sorted nearby' : 'Romania map'}
        </Text>
      </View>

      <AppPressable
        onPress={() => Linking.openURL(allStoresMapUrl)}
        className="mb-4 flex-row items-center rounded-2xl border border-green-100 bg-green-50 px-4 py-3"
      >
        <Text
          className="flex-1 text-xs font-bold text-green-800"
          style={{ paddingRight: 24 }}
          numberOfLines={2}
        >
          See the full Froo network on Google Maps
        </Text>
        <Text
          className="text-xs font-bold text-green-800"
          style={{ width: 96 }}
          numberOfLines={2}
        >
          {OFFICIAL_STORE_COUNT} official locations
        </Text>
      </AppPressable>

      {locationStatus === 'denied' && (
        <View className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <Text className="text-xs font-semibold text-amber-800">
            Location is off, so stores are shown by city. You can still search and open directions.
          </Text>
        </View>
      )}

      <View className="gap-3">
        {stores.map((store, index) => {
          const selected = store.id === selectedStore.id;
          return (
            <Animated.View
              key={store.id}
              entering={FadeInDown.duration(300)
                .delay(Math.min(index, 5) * 40)
                .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] })}
            >
              <AppPressable
                onPress={() => setSelectedStoreId(store.id)}
                className={`w-full rounded-3xl border p-4 shadow-sm ${selected ? 'border-green-200 bg-green-50/70' : 'border-slate-100 bg-white'}`}
              >
                <View className="flex-row justify-between gap-3">
                  <View className="flex-row min-w-0 flex-1 items-start gap-3">
                    <View className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-green-600' : 'bg-green-50'}`}>
                      <MapPin size={20} color={selected ? 'white' : '#15803d'} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="truncate text-sm font-bold text-slate-900" numberOfLines={1}>{store.name}</Text>
                      <Text className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{store.address}</Text>
                    </View>
                  </View>
                  <View className="shrink-0 rounded-xl border border-slate-100 bg-white px-3 py-1.5">
                    <Text className="text-[10px] font-bold text-slate-500">{formatDistance(store.distanceKm)}</Text>
                  </View>
                </View>
                <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
                  <View className="flex-row items-center gap-2">
                    <View className={`h-2 w-2 rounded-full ${store.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${store.active ? 'text-green-600' : 'text-slate-400'}`}>
                      {store.active ? 'Active store' : 'Inactive'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={14} color="#64748b" />
                    <Text className="text-[10px] font-bold text-slate-500">{store.openingHours}</Text>
                  </View>
                </View>
              </AppPressable>
            </Animated.View>
          );
        })}
      </View>

      {stores.length === 0 && (
        <View className="rounded-3xl border border-slate-100 bg-slate-50 p-6 items-center">
          <Text className="text-sm font-bold text-slate-800">No Froo stores match that search.</Text>
          <Text className="mt-2 text-xs font-medium text-slate-500">Try Bucuresti, Ilfov, Ploiesti, or a street name.</Text>
        </View>
      )}
    </View>
  );
}
