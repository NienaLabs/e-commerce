import React from 'react';
import { Marker, Callout } from '@maplibre/maplibre-react-native';
import { View, Text, StyleSheet } from 'react-native';

export interface MapMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  id,
  coordinate,
  title,
  description,
  children,
  onPress
}) => {
  return (
    <Marker id={id} lngLat={coordinate} onPress={onPress}>
      <View>
        {children ? children : (
          <View style={styles.defaultMarker}>
            <View style={styles.innerDot} />
          </View>
        )}
        {(title || description) && (
          <Callout title={title}>
            <View style={styles.calloutContainer}>
              {title && <Text style={styles.calloutTitle}>{title}</Text>}
              {description && <Text style={styles.calloutDescription}>{description}</Text>}
            </View>
          </Callout>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  defaultMarker: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  innerDot: {
    width: 14,
    height: 14,
    backgroundColor: '#ff3b30',
    borderRadius: 7,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
  },
});
