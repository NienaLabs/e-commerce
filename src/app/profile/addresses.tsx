import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import * as Location from 'expo-location';
import { Button } from '../../components/Button';
import { LocationSearchModal, LocationResult } from '../../components/LocationSearchModal';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';

async function reverseGeocodeAddress(lat: number, lng: number) {
  if (Platform.OS === 'web') {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ElectricApp/1.0' } }
    );
    const data = await res.json();
    const a = data?.address;
    return {
      street: `${a?.house_number || ''} ${a?.road || ''}`.trim() || 'Unknown Street',
      city: `${a?.city || a?.town || a?.village || ''}, ${a?.state || ''} ${a?.postcode || ''}`.trim(),
    };
  } else {
    return null;
  }
}

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  isDefault?: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  { id: '1', name: 'Home', street: '123 Tech Avenue, Apt 4B', city: 'San Francisco, CA 94105', isDefault: true },
];

export default function AddressesScreen() {
  const { colors } = useTheme();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState(false);

  // Load addresses from local storage
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_addresses');
        if (stored) {
          setAddresses(JSON.parse(stored));
        } else {
          setAddresses(INITIAL_ADDRESSES);
        }
      } catch (e) {
        console.error('Failed to load addresses:', e);
      } finally {
        setLoaded(true);
      }
    };
    loadAddresses();
  }, []);

  // Save addresses to local storage whenever they change (only after initial load)
  useEffect(() => {
    if (!loaded) return;
    const saveAddresses = async () => {
      try {
        await AsyncStorage.setItem('@user_addresses', JSON.stringify(addresses));
      } catch (e) {
        console.error('Failed to save addresses:', e);
      }
    };
    saveAddresses();
  }, [addresses, loaded]);

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
    showToast('Default address updated.', 'success');
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow location access in your browser/device settings.', 'warning');
        setIsLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const webResult = await reverseGeocodeAddress(loc.coords.latitude, loc.coords.longitude);
      let street: string;
      let city: string;

      if (webResult) {
        street = webResult.street;
        city = webResult.city;
      } else {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode.length > 0) {
          const place = geocode[0];
          street = `${place.streetNumber || ''} ${place.street || ''}`.trim() || 'Unknown Street';
          city = `${place.city || ''}, ${place.region || ''} ${place.postalCode || ''}`.trim();
        } else {
          showToast('Could not determine exact address from location.', 'error');
          setIsLoading(false);
          return;
        }
      }

      const newAddress: Address = {
        id: Date.now().toString(),
        name: 'Current Location',
        street,
        city,
      };
      setAddresses(prev => [newAddress, ...prev]);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch location. Please try again.', 'error');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Shipping Addresses</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ marginBottom: 32, gap: 12 }}>
          {isLoading ? (
            <View style={{ padding: 16, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.inkMuted, marginTop: 8 }}>Locating...</Text>
            </View>
          ) : (
            <Button title="Use Current Location" onPress={handleUseCurrentLocation} />
          )}

          <Pressable
            onPress={() => setShowLocationSearch(true)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
              padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
            })}
          >
            <Ionicons name="search" size={20} color={colors.ink} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Search for Address</Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Saved Addresses</Text>
        <View style={{ gap: 16 }}>
          {addresses.map(addr => (
            <Pressable key={addr.id} onPress={() => handleSetDefault(addr.id)} style={{
              backgroundColor: colors.surface, borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: addr.isDefault ? colors.primary : colors.surfaceMuted,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.3 : 0.05, shadowRadius: 10, elevation: 2
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={addr.name === 'Home' ? "home" : "location"} size={20} color={colors.ink} style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{addr.name}</Text>
                </View>
                {addr.isDefault && (
                  <View style={{ backgroundColor: colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.primaryDim, textTransform: 'uppercase' }}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginBottom: 2 }}>{addr.street}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>{addr.city}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <LocationSearchModal
        visible={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={(loc: LocationResult) => {
          const newAddress: Address = {
            id: Date.now().toString(),
            name: loc.name,
            street: loc.street,
            city: loc.city,
          };
          setAddresses(prev => [newAddress, ...prev]);
          setShowLocationSearch(false);
        }}
      />
    </SafeAreaView>
  );
}
