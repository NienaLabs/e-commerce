import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { StyleProp, ViewStyle, View } from 'react-native';
import { MapContext } from './MapContext';

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
}

export const MapView: React.FC<MapViewProps> = ({ 
  style, 
  mapStyle = 'https://demotiles.maplibre.org/style.json',
  initialRegion = { latitude: 0, longitude: 0, zoom: 1 },
  children,
  showUserLocation = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Capture initial values in refs so the effect runs only once
  // (passing initialRegion as an object from JSX would be a new object every render)
  const initialRegionRef = useRef(initialRegion);
  const mapStyleRef = useRef(mapStyle);
  const showUserLocationRef = useRef(showUserLocation);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyleRef.current,
        center: [initialRegionRef.current.longitude, initialRegionRef.current.latitude],
        zoom: initialRegionRef.current.zoom,
      });

      if (showUserLocationRef.current) {
        // maplibregl.GeolocateControl is used for user location tracking on web
        map.current.addControl(
          new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
          })
        );
      }

      setMapInstance(map.current);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // Empty deps array: map initializes exactly once per mount

  return (
    <View style={[{ flex: 1 }, style]}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <MapContext.Provider value={mapInstance}>
        {mapInstance && children}
      </MapContext.Provider>
    </View>
  );
};
