import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from './MapContext';
import { createPortal } from 'react-dom';
import { View, StyleSheet } from 'react-native';

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
  const map = useMapContext();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Keep onPress in a ref so the click listener is stable (no re-add on every render)
  const onPressRef = useRef(onPress);
  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  // Only create container element on the client side (web)
  const [container] = React.useState<HTMLDivElement | null>(() => {
    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.style.backgroundColor = 'transparent';
      div.style.border = 'none';
      div.style.outline = 'none';
      div.style.padding = '0';
      div.style.margin = '0';
      div.style.cursor = 'pointer';
      (div.style as any).webkitTapHighlightColor = 'transparent';
      div.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      return div;
    }
    return null;
  });

  // Create the marker once when the map is ready
  useEffect(() => {
    if (!map || !container) return;

    // Create popup if title or description exists
    let popup: maplibregl.Popup | undefined;
    if (title || description) {
      popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; min-width: 120px;">
          ${title ? `<strong style="display:block; margin-bottom: 4px; font-size: 14px;">${title}</strong>` : ''}
          ${description ? `<span style="font-size: 12px; color: #666;">${description}</span>` : ''}
        </div>
      `);
    }

    markerRef.current = new maplibregl.Marker({
      element: container,
    })
      .setLngLat(coordinate)
      .addTo(map);

    // Use a stable wrapper that always calls the latest onPress ref.
    //
    // stopPropagation is load-bearing, not defensive. MapLibre mounts marker
    // elements inside the map's own canvas container, and binds the map's
    // 'click' event on that same container — so without this, one tap on a
    // marker runs the marker's onPress AND the map's onPress. On Discover that
    // meant selecting a vendor also dropped the delivery pin on top of the
    // vendor's icon, since the map handler reads the click's lngLat.
    const stableClickHandler = (event: MouseEvent) => {
      event.stopPropagation();
      onPressRef.current?.();
    };

    if (container) {
      container.addEventListener('click', stableClickHandler);
    }

    if (popup) {
      markerRef.current.setPopup(popup);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', stableClickHandler);
      }
      markerRef.current?.remove();
      markerRef.current = null;
    };
    // Only re-create when map or coordinate changes — not onPress (handled via ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordinate[0], coordinate[1]]);

  if (!container) return null;

  return createPortal(
    children ? children : (
      <View style={styles.defaultMarker}>
        <View style={styles.innerDot} />
      </View>
    ),
    container
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
    // @ts-ignore - web only
    boxShadow: '0px 2px 4px rgba(0,0,0,0.3)',
  },
  innerDot: {
    width: 14,
    height: 14,
    backgroundColor: '#ff3b30',
    borderRadius: 7,
  },
});
