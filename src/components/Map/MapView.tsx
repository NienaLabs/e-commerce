import React from 'react';
import { Map, Camera, UserLocation } from '@maplibre/maplibre-react-native';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

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

export { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

export const MapView: React.FC<MapViewProps> = ({ 
  style, 
  mapStyle = 'https://demotiles.maplibre.org/style.json',
  initialRegion = { latitude: 0, longitude: 0, zoom: 1 },
  children,
  showUserLocation = false,
  onPress,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Map 
        style={styles.map} 
        mapStyle={mapStyle}
        logo={false}
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
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
