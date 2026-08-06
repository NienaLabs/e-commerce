import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Guard against Expo Go which lacks the MLRNCameraModule native module.
// @maplibre/maplibre-react-native calls TurboModuleRegistry.getEnforcing at
// module-init time — wrapping in try/catch prevents the crash.
let MapLibre: any = null;
try {
  MapLibre = require('@maplibre/maplibre-react-native');
} catch (e) {
  console.warn('[MapView] MapLibre native modules unavailable (Expo Go). Map will show a placeholder. Use a dev build for the full map experience.');
}

export interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  mapStyle?: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  children?: React.ReactNode;
  showUserLocation?: boolean;
  onPress?: (feature: any) => void;
}

// Re-export map sub-components — stub them out when MapLibre unavailable
export const GeoJSONSource: React.FC<any> = MapLibre
  ? MapLibre.GeoJSONSource
  : ({ children }: any) => <>{children}</>;

export const Layer: React.FC<any> = MapLibre
  ? MapLibre.Layer
  : () => null;

// Placeholder shown in Expo Go instead of crashing
function MapPlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.placeholder, style]}>
      <Ionicons name="map-outline" size={48} color="#9ca3af" />
      <Text style={styles.placeholderTitle}>Map Unavailable in Expo Go</Text>
      <Text style={styles.placeholderSub}>
        Use a development build to see the full interactive map.
      </Text>
    </View>
  );
}

export const MapView: React.FC<MapViewProps> = ({
  style,
  mapStyle = 'https://demotiles.maplibre.org/style.json',
  initialRegion = { latitude: 0, longitude: 0, zoom: 1 },
  children,
  showUserLocation = false,
  onPress,
}) => {
  if (!MapLibre) {
    return <MapPlaceholder style={style} />;
  }

  const { Map, Camera, UserLocation } = MapLibre;
  return (
    <View style={[styles.container, style]}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={true}
        attributionEnabled={true}
        onPress={onPress}
      >
        <Camera
          zoom={initialRegion.zoom}
          center={[initialRegion.longitude, initialRegion.latitude]}
        />
        {showUserLocation && <UserLocation />}
        {children}
      </Map>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    gap: 12,
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
