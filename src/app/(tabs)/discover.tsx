import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions, Pressable, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '../../store/locationStore';
import { listVendors } from '../../api/vendors';
import { listCategories, listProducts } from '../../api/products';
import haversine from 'haversine';
import { MapView, GeoJSONSource, Layer } from '../../components/Map/MapView';
import { MapMarker } from '../../components/Map/MapMarker';
import { VendorAvatar } from '../../components/VendorAvatar';

// Helper to get distance badge colors. Accepts null for "no GPS fix yet" —
// the badge isn't rendered in that case, but this is called before the check.
function getDistanceBadgeColor(km: number | null, colors: any) {
  if (km === null) return { bg: colors.surfaceSoft, text: colors.inkMuted };
  if (km < 2) return { bg: colors.primaryGhost, text: colors.primaryDim };
  if (km < 5) return { bg: colors.warningGhost, text: colors.warning };
  return { bg: colors.surfaceSoft, text: colors.inkMuted };
}

const ALL_CATEGORY_ID = 'all';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  const { latitude, longitude, status: locationStatus, errorMsg } = useLocationStore();
  // Memoised on the primitives: this object feeds an effect dependency array,
  // and a fresh object every render would re-fire the route lookup endlessly.
  const userLocation = useMemo(
    () => (latitude && longitude ? { latitude, longitude } : null),
    [latitude, longitude]
  );
  const loading = locationStatus === 'loading' || locationStatus === 'idle';
  const locationError = errorMsg;
  
  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

  // Real Vendors from API
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors({ limit: 100 }),
  });

  // Real category chips, so the filter can never offer a category that
  // doesn't exist (the old list was hardcoded and unrelated to the data).
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });

  // A vendor has no category of its own — it belongs to a category by virtue
  // of selling something in it. Ask for that category's products and keep the
  // vendors behind them. Only runs when a real category is selected.
  const { data: categoryProducts = [], isFetching: categoryLoading } = useQuery({
    queryKey: ['category-vendor-ids', activeCategory],
    // The endpoint caps limit at 100 (le=100) and 422s above it, so page
    // through rather than asking for one oversized batch. We only need the
    // distinct vendor ids, so stop as soon as a short page comes back.
    queryFn: async () => {
      const PAGE = 100;
      const MAX_PAGES = 5;
      const all: Awaited<ReturnType<typeof listProducts>> = [];
      for (let i = 0; i < MAX_PAGES; i++) {
        const page = await listProducts({
          category_id: activeCategory,
          skip: i * PAGE,
          limit: PAGE,
        });
        all.push(...page);
        if (page.length < PAGE) break;
      }
      return all;
    },
    enabled: activeCategory !== ALL_CATEGORY_ID,
    staleTime: 60_000,
  });

  const vendorIdsInCategory = useMemo(() => {
    if (activeCategory === ALL_CATEGORY_ID) return null;
    return new Set(categoryProducts.map(p => p.vendor_id));
  }, [activeCategory, categoryProducts]);

  // Calculate distances & filter
  const processedVendors = useMemo(() => {
    return vendors.map(v => {
      // Use real coordinates from API if present, or default to Accra's center coordinates
      const lat = v.latitude !== null && v.latitude !== undefined ? v.latitude : 5.6037;
      const lng = v.longitude !== null && v.longitude !== undefined ? v.longitude : -0.1870;

      // Distance is measured from wherever the shopper actually is. With no
      // fix on their location we report null rather than inventing a number —
      // the old code defaulted every vendor to a flat 5.0km, which made the
      // "nearest first" ordering and every ETA badge quietly meaningless.
      const distanceKm = userLocation
        ? haversine(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: lat, longitude: lng },
            { unit: 'km' }
          )
        : null;

      return {
        ...v,
        distanceKm,
        etaMins: distanceKm === null ? null : Math.round(distanceKm * 3 + 10),
        isOpen: true,
        lat,
        lng,
        image: v.logo_url ?? null,
      };
    });
  }, [vendors, userLocation]);

  const filteredVendors = processedVendors.filter(v => {
    const matchesSearch = v.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    // null means "All" — no category narrowing at all.
    const matchesCategory = !vendorIdsInCategory || vendorIdsInCategory.has(v.id);
    return matchesSearch && matchesCategory;
  })
  // Nearest first when we know where the user is; vendors with no distance
  // sink to the bottom rather than jumbling in at a fake 5km.
  .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

  const centerLat = userLocation?.latitude ?? 5.6037;
  const centerLng = userLocation?.longitude ?? -0.187;

  // Draw the driving route from the shopper to whichever vendor they tapped —
  // the map's job here is to answer "how far is this store from me".
  useEffect(() => {
    if (!selectedVendor || !userLocation) {
      setRouteGeoJSON(null);
      return;
    }
    const vendor = vendors.find(v => v.id === selectedVendor);
    if (!vendor) return;
    
    const vLat = vendor.latitude !== null && vendor.latitude !== undefined ? vendor.latitude : 5.6037;
    const vLng = vendor.longitude !== null && vendor.longitude !== undefined ? vendor.longitude : -0.1870;

    // Cancels in-flight work if the vendor/location changes or we unmount, so a
    // slow late response can't overwrite a newer route (or set state after unmount).
    let cancelled = false;

    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${vLng},${vLat}?overview=full&geometries=geojson`;

      // The public OSRM demo server is frequently rate-limited and drops
      // connections, surfacing as "Failed to fetch". A single attempt often
      // fails on first load and only recovers when the effect happens to
      // re-run, so retry a few times with backoff and a per-attempt timeout.
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (!res.ok) throw new Error(`OSRM responded ${res.status}`);
          const data = await res.json();
          if (cancelled) return;
          if (data.routes && data.routes.length > 0) {
            setRouteGeoJSON({
              type: 'Feature',
              geometry: data.routes[0].geometry,
            });
          }
          return; // success — stop retrying
        } catch (e) {
          clearTimeout(timeout);
          if (cancelled) return;
          if (attempt === MAX_ATTEMPTS) {
            console.warn('Route fetch failed after retries:', e);
            return;
          }
          // Exponential-ish backoff before the next attempt.
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    };

    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [selectedVendor, userLocation, vendors]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      
      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink }}>Discover</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 2 }}>
              Find vendors near you
            </Text>
          </View>
          {userLocation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Ionicons name="location" size={14} color={colors.primaryDim} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primaryDim, marginLeft: 4 }}>
                GPS Active
              </Text>
            </View>
          )}
        </View>

        {/* ── Search & Toggle Row ── */}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {/* minWidth: 0 on both the row and the input is what actually stops
              the placeholder spilling out. A flex item defaults to
              min-width:auto, so it refuses to shrink below its text and
              overflows the rounded box instead of ellipsising inside it. */}
          <View style={{
            flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surfaceSoft, borderRadius: 16, paddingHorizontal: 16, height: 48,
            borderWidth: 1, borderColor: colors.surfaceMuted,
          }}>
            <Ionicons name="search" size={20} color={colors.inkGhost} style={{ flexShrink: 0 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              placeholder="Search vendors"
              placeholderTextColor={colors.inkGhost}
              numberOfLines={1}
              style={{ flex: 1, minWidth: 0, marginLeft: 10, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none', textOverflow: 'ellipsis' } as any : {}) }}
            />
          </View>

          {/* Map/List Toggle (Mobile Only) */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Pressable
                onPress={() => setViewMode('list')}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: viewMode === 'list' ? colors.surface : 'transparent', shadowColor: viewMode === 'list' ? '#000' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: viewMode === 'list' ? 2 : 0 }}
              >
                <Ionicons name="list" size={20} color={viewMode === 'list' ? colors.ink : colors.inkGhost} />
              </Pressable>
              <Pressable
                onPress={() => setViewMode('map')}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: viewMode === 'map' ? colors.surface : 'transparent', shadowColor: viewMode === 'map' ? '#000' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: viewMode === 'map' ? 2 : 0 }}
              >
                <Ionicons name="map" size={20} color={viewMode === 'map' ? colors.ink : colors.inkGhost} />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Category Filters ── */}
        <View style={{ marginTop: 12, marginHorizontal: -20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {[{ id: ALL_CATEGORY_ID, name: 'All' }, ...categories].map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? colors.ink : colors.surface,
                    borderWidth: 1, borderColor: isActive ? colors.ink : colors.surfaceMuted,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: isActive ? colors.surface : colors.inkSoft }}>{cat.name}</Text>
                  {isActive && categoryLoading && <ActivityIndicator size="small" color={colors.surface} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {locationError && (
        <View style={{ backgroundColor: colors.warningGhost, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.warningGhost }}>
          <Ionicons name="warning" size={16} color={colors.warning} style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.warning, flex: 1 }}>{locationError}</Text>
        </View>
      )}

      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>

        {/* ── Map View ── */}
        {(isDesktop || viewMode === 'map') && (
          <View style={{ flex: isDesktop ? 3 : 1, backgroundColor: colors.surfaceMuted, position: 'relative' }}>
            {(loading || vendorsLoading) ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <ActivityIndicator size="large" color={colors.primaryDim} />
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>
                  {loading ? 'Locating you…' : 'Loading vendors…'}
                </Text>
              </View>
            ) : (
              /* The map is a browsing aid, not an input. The only pin the user
                 gets is their own GPS dot, drawn by the map itself via
                 showUserLocation — there is deliberately no onPress, so tapping
                 bare map does nothing. */
              <MapView
                style={{ flex: 1 }}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                initialRegion={{
                  latitude: centerLat,
                  longitude: centerLng,
                  zoom: 12,
                }}
                showUserLocation={true}
              >
                {/* Route Line — from the shopper to the vendor they tapped */}
                {routeGeoJSON && (
                  <GeoJSONSource id="routeSource" data={routeGeoJSON}>
                    <Layer id="routeFill" type="line" style={{ lineColor: colors.primary, lineWidth: 4 }} />
                  </GeoJSONSource>
                )}
                {filteredVendors.map(vendor => (
                  <MapMarker
                    key={vendor.id}
                    id={vendor.id}
                    coordinate={[vendor.lng, vendor.lat]}
                    onPress={() => setSelectedVendor(vendor.id)}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: selectedVendor === vendor.id ? colors.ink : colors.surface, borderWidth: 2, borderColor: selectedVendor === vendor.id ? '#ffffff' : colors.primaryDim, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, overflow: 'hidden' }}>
                      <VendorAvatar uri={vendor.image} size={32} radius={16} />
                    </View>
                  </MapMarker>
                ))}
              </MapView>
            )}

            {/* Selected Vendor Preview Card (Mobile Map View) */}
            {!isDesktop && viewMode === 'map' && selectedVendor && (
              <View style={{ position: 'absolute', bottom: insets.bottom + 100, left: 20, right: 20 }}>
                {(() => {
                  const v = filteredVendors.find(x => x.id === selectedVendor);
                  if (!v) return null;
                  return (
                    <View>
                      <Pressable
                        onPress={() => router.push(`/vendor/${v.id}` as any)}
                        style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 16, paddingRight: 28, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 }}
                      >
                        <VendorAvatar uri={v.image} size={60} radius={14} style={{ marginRight: 14 }} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 4 }} numberOfLines={1}>{v.store_name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {/* Distance is only shown once we have a GPS fix —
                                see processedVendors. */}
                            {v.distanceKm !== null && (
                              <>
                                <Ionicons name="navigate" size={12} color={colors.inkMuted} />
                                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkMuted }}>
                                  {v.distanceKm.toFixed(1)} km away
                                </Text>
                                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkGhost }}>•</Text>
                              </>
                            )}
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: v.isOpen ? colors.success : colors.error }}>{v.isOpen ? 'Open' : 'Closed'}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.inkGhost} />
                      </Pressable>

                      {/* Dismiss. Selecting a pin was a one-way door — the card
                          covered the map with no way to put it away. Sits above
                          the card so it can't be swallowed by the row press. */}
                      <Pressable
                        onPress={() => setSelectedVendor(null)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss vendor card"
                        style={({ pressed }) => ({
                          position: 'absolute', top: -8, right: -8,
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: colors.ink,
                          alignItems: 'center', justifyContent: 'center',
                          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25, shadowRadius: 6, elevation: 10,
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Ionicons name="close" size={16} color={colors.surface} />
                      </Pressable>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>
        )}

        {/* ── Vendor List View ── */}
        {(isDesktop || viewMode === 'list') && (
          <View style={{
            flex: isDesktop ? 2 : 1,
            backgroundColor: colors.surface,
            borderLeftWidth: isDesktop ? 1 : 0,
            borderColor: colors.surfaceMuted,
          }}>
            <View style={{
              paddingHorizontal: 20, paddingVertical: 16,
              borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {/* "nearby" only means something once we can measure distance. */}
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>
                {filteredVendors.length} {userLocation ? 'vendors nearby' : 'vendors'}
              </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: Math.max(120, insets.bottom + 120) }} showsVerticalScrollIndicator={false}>
              {filteredVendors.map(vendor => {
                const badge = getDistanceBadgeColor(vendor.distanceKm, colors);
                const isSelected = selectedVendor === vendor.id;
                return (
                  <Pressable
                    key={vendor.id}
                    onPress={() => {
                      setSelectedVendor(vendor.id);
                      if (!isDesktop) router.push(`/vendor/${vendor.id}` as any);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', padding: 14,
                      backgroundColor: isSelected && isDesktop ? colors.primaryGhost : (pressed ? colors.surfaceSoft : colors.surface),
                      borderRadius: 18,
                      borderWidth: 1.5, borderColor: isSelected && isDesktop ? colors.primary : colors.surfaceMuted,
                    })}
                  >
                    <VendorAvatar uri={vendor.image} size={56} radius={14} style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }} numberOfLines={1}>
                        {vendor.store_name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkSoft }}>Store</Text>
                      </View>
                    </View>
                    {vendor.distanceKm !== null && (
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                          <Ionicons name="navigate" size={12} color={badge.text} style={{ marginRight: 4 }} />
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: badge.text }}>{vendor.distanceKm.toFixed(1)} km</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
