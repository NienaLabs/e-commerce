import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied';
  errorMsg: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

let locationSubscription: Location.LocationSubscription | null = null;

async function reverseGeocodeCity(lat: number, lng: number): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'Konura/1.0' } }
      );
      const data = await res.json();
      const a = data?.address;
      return a?.city || a?.town || a?.village || a?.county || a?.state || 'Current Location';
    } else {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const p = results[0];
        return p.city || p.district || p.region || p.subregion || 'Current Location';
      }
      return 'Current Location';
    }
  } catch {
    return 'Current Location';
  }
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  city: null,
  status: 'idle',
  errorMsg: null,

  startTracking: async () => {
    const currentState = get();
    if (currentState.status === 'loading') return;

    set({ status: 'loading', errorMsg: null });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ status: 'denied', errorMsg: 'Permission to access location was denied' });
        return;
      }

      // First fast fetch
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const initialCity = await reverseGeocodeCity(loc.coords.latitude, loc.coords.longitude);
      set({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city: initialCity,
        status: 'success',
      });

      // Start continuous high-accuracy tracking
      if (locationSubscription) {
        locationSubscription.remove();
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const state = get();
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          
          // Only reverse geocode if moved significantly (approx 1km) to save API calls
          let newCity = state.city;
          if (!state.latitude || !state.longitude || Math.abs(state.latitude - lat) > 0.01 || Math.abs(state.longitude - lng) > 0.01) {
            newCity = await reverseGeocodeCity(lat, lng);
          }

          set({
            latitude: lat,
            longitude: lng,
            city: newCity,
            status: 'success',
          });
        }
      );
    } catch (err: any) {
      set({ status: 'error', errorMsg: err.message || 'Failed to fetch location' });
    }
  },

  stopTracking: () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    set({ status: 'idle' });
  },
}));
