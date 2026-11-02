import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import type { Store } from '../types';

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

type UserLocation = {
  lat: number;
  lng: number;
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function distanceInKm(from: UserLocation, to: Store) {
  const toRadians = (value: number) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

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
  const [query, setQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(FROO_STORES[0].id);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'denied'>('idle');

  const stores = useMemo(() => {
    const needle = normalize(query.trim());
    const filtered = FROO_STORES.filter((store) => {
      const haystack = normalize(`${store.name} ${store.address} ${store.town}`);
      return !needle || haystack.includes(needle);
    });

    return filtered
      .map((store) => ({
        ...store,
        distanceKm: userLocation ? distanceInKm(userLocation, store) : undefined,
      }))
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return a.town.localeCompare(b.town) || a.name.localeCompare(b.name);
      });
  }, [query, userLocation]);

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? FROO_STORES[0];
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery(selectedStore))}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(selectedStore))}&travelmode=walking`;

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('idle');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <div className="p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Froo Romania</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Nearby Stores</h2>
        </div>
        <button
          onClick={requestLocation}
          className="shrink-0 rounded-2xl border border-green-100 bg-green-50 p-3 text-green-700 transition-colors hover:bg-green-100 active:scale-95"
          aria-label="Use my location"
          title="Use my location"
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      </div>
      
      <div className="relative mb-4">
        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city or street..." 
          className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl pl-14 pr-5 py-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
        />
      </div>

      <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
        <div className="relative h-56 bg-slate-100">
          <iframe
            key={selectedStore.id}
            title={`Google map for ${selectedStore.name}`}
            src={mapSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-white/0" />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">{selectedStore.name}</h3>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">{selectedStore.address}</p>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-green-200 transition-colors hover:bg-green-700 active:scale-95"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </a>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <span>{stores.length} matching locations</span>
        <span>{locationStatus === 'loading' ? 'Finding you...' : userLocation ? 'Sorted nearby' : 'Romania map'}</span>
      </div>

      <a
        href={allStoresMapUrl}
        target="_blank"
        rel="noreferrer"
        className="mb-4 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-800 transition-colors hover:bg-green-100 active:scale-[0.99]"
      >
        <span>See the full Froo network on Google Maps</span>
        <span>{OFFICIAL_STORE_COUNT} official locations</span>
      </a>

      {locationStatus === 'denied' && (
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Location is off, so stores are shown by city. You can still search and open directions.
        </div>
      )}

      <div className="space-y-3">
        {stores.map((store, i) => {
          const selected = store.id === selectedStore.id;

          return (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 5) * 0.04 }}
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className={`w-full rounded-3xl border p-4 text-left shadow-sm transition-colors active:scale-[0.99] ${
                selected ? 'border-green-200 bg-green-50/70' : 'border-slate-100 bg-white hover:border-green-100'
              }`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    selected ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900">{store.name}</h4>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{store.address}</p>
                  </div>
                </div>
                <p className="shrink-0 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500">
                  {formatDistance(store.distanceKm)}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                  store.active ? 'text-green-600' : 'text-slate-400'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${store.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  {store.active ? 'Active store' : 'Inactive'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {store.openingHours}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {stores.length === 0 && (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center">
          <p className="text-sm font-bold text-slate-800">No Froo stores match that search.</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Try Bucuresti, Ilfov, Ploiesti, or a street name.</p>
        </div>
      )}
    </div>
  );
}
