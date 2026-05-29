import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import * as Location from 'expo-location';
import { Button } from '../../components/Button';

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
    return null; // signal to use expo-location's geocoder
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
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [isLoading, setIsLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access in your browser/device settings.');
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
        // Web: used Nominatim
        street = webResult.street;
        city = webResult.city;
      } else {
        // Native: use expo-location geocoder
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode.length > 0) {
          const place = geocode[0];
          street = `${place.streetNumber || ''} ${place.street || ''}`.trim() || 'Unknown Street';
          city = `${place.city || ''}, ${place.region || ''} ${place.postalCode || ''}`.trim();
        } else {
          Alert.alert('Error', 'Could not determine exact address from location.');
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
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Shipping Addresses</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        
        {/* Action Button */}
        <View style={{ marginBottom: 32 }}>
          {isLoading ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator color="#c3d809" />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#6b696b', marginTop: 8 }}>Locating...</Text>
            </View>
          ) : (
            <Button title="Use Current Location" onPress={handleUseCurrentLocation} />
          )}
        </View>

        {/* Address List */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022', marginBottom: 16 }}>Saved Addresses</Text>
        <View style={{ gap: 16 }}>
          {addresses.map(addr => (
            <View key={addr.id} style={{ 
              backgroundColor: '#ffffff', borderRadius: 20, padding: 20, 
              borderWidth: 1, borderColor: addr.isDefault ? '#c3d809' : '#eceae6',
              shadowColor: '#222022', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={addr.name === 'Home' ? "home" : "location"} size={20} color="#222022" style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>{addr.name}</Text>
                </View>
                {addr.isDefault && (
                  <View style={{ backgroundColor: '#c3d80920', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#7a8a05', textTransform: 'uppercase' }}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', marginBottom: 2 }}>{addr.street}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b' }}>{addr.city}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
