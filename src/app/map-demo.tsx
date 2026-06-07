import React, { useContext } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MapView } from '@/components/Map/MapView';
import { MapMarker } from '@/components/Map/MapMarker';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listVendors, Vendor } from '../api/vendors';
import { useTheme } from '../theme/ThemeContext';

export default function MapDemoScreen() {
  const { colors } = useTheme();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors-map'],
    queryFn: () => listVendors({ limit: 50 }),
  });

  // Only show vendors that have coordinates saved
  const mappableVendors = vendors.filter((v: Vendor) => v.latitude != null && v.longitude != null);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Nearby Vendors', headerBackTitle: 'Back' }} />
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: mappableVendors[0]?.latitude ?? 5.6037,
            longitude: mappableVendors[0]?.longitude ?? -0.1870,
            zoom: 12
          }}
          showUserLocation={true}
        >
          {mappableVendors.map((vendor: Vendor) => (
            <MapMarker
              key={vendor.id}
              id={vendor.id}
              coordinate={[vendor.longitude!, vendor.latitude!]}
              title={vendor.store_name}
              description={vendor.bio ?? 'Tap to visit store'}
              onPress={() => router.push(`/vendor/${vendor.id}` as any)}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
