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
  onPress?: (feature: any) => void;
}

const SourceContext = React.createContext<{ id: string; ready: boolean } | null>(null);

export const GeoJSONSource: React.FC<any> = ({ id, data, children }) => {
  const map = React.useContext(MapContext);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data });
      setReady(true);
    } else {
      const source = map.getSource(id) as maplibregl.GeoJSONSource;
      if (source && source.setData) {
        source.setData(data);
      }
      setReady(true);
    }
  }, [map, id, data]);

  return <SourceContext.Provider value={{ id, ready }}>{children}</SourceContext.Provider>;
};

export const Layer: React.FC<any> = ({ id, type, style }) => {
  const map = React.useContext(MapContext);
  const sourceContext = React.useContext(SourceContext);

  useEffect(() => {
    if (!map || !sourceContext || !sourceContext.ready) return;
    const sourceId = sourceContext.id;
    
    const paintStyle: any = {};
    if (type === 'line' && style) {
      if (style.lineColor) paintStyle['line-color'] = style.lineColor;
      if (style.lineWidth) paintStyle['line-width'] = style.lineWidth;
    }

    if (!map.getLayer(id)) {
      map.addLayer({
        id,
        type: type,
        source: sourceId,
        paint: paintStyle
      });
    } else {
      // update paint properties if layer exists
      if (paintStyle['line-color']) map.setPaintProperty(id, 'line-color', paintStyle['line-color']);
      if (paintStyle['line-width']) map.setPaintProperty(id, 'line-width', paintStyle['line-width']);
    }

    return () => {
      // Don't auto-remove to prevent conflicts if GeoJSONSource is removed first
      // But ideally we clean up. For simplicity, we skip aggressive cleanup.
    };
  }, [map, sourceContext?.id, sourceContext?.ready, id, type, style]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  style, 
  mapStyle = 'https://demotiles.maplibre.org/style.json',
  initialRegion = { latitude: 0, longitude: 0, zoom: 1 },
  children,
  showUserLocation = false,
  onPress,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Capture initial values in refs so the effect runs only once
  // (passing initialRegion as an object from JSX would be a new object every render)
  const initialRegionRef = useRef(initialRegion);
  const mapStyleRef = useRef(mapStyle);
  const showUserLocationRef = useRef(showUserLocation);
  
  // Create a stable ref for onPress so we don't need to re-bind event listeners
  const onPressRef = useRef(onPress);
  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyleRef.current,
        center: [initialRegionRef.current.longitude, initialRegionRef.current.latitude],
        zoom: initialRegionRef.current.zoom,
      });

      map.current.on('click', (e) => {
        if (onPressRef.current) {
          onPressRef.current({
            geometry: { coordinates: [e.lngLat.lng, e.lngLat.lat] }
          });
        }
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

      map.current.on('load', () => {
        setMapInstance(map.current);
      });
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
