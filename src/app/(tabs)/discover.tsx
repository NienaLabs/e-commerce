import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions, Pressable, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { listVendors } from '../../api/vendors';
import haversine from 'haversine';
// Only import MapView on native devices to avoid web bundler issues if web maps aren't fully configured
let MapView: any;
let Marker: any;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (e) {
    console.log('react-native-maps not found', e);
  }
}

// Helper to get distance badge colors
function getDistanceBadgeColor(km: number, colors: any) {
  if (km < 2) return { bg: colors.primaryGhost, text: colors.primaryDim };
  if (km < 5) return { bg: colors.warningGhost, text: colors.warning };
  return { bg: colors.surfaceSoft, text: colors.inkMuted };
}

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports', 'Food & Groceries'];

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Showing approximate distances.');
          setUserLocation({ latitude: 5.6037, longitude: -0.187 });
        } else {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        setLocationError('Could not fetch location. Showing approximate distances.');
        setUserLocation({ latitude: 5.6037, longitude: -0.187 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Real Vendors from API
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors({ limit: 100 }),
  });

  // Calculate distances & filter
  const processedVendors = vendors.map(v => {
    // We don't have real GPS coordinates in the API yet, so we mock distance for now
    const distanceKm = Math.random() * 8 + 1; // 1 to 9 km
    const etaMins = Math.round((distanceKm * 3) + 10);
    return {
      ...v,
      distanceKm,
      etaMins,
      isOpen: true,
      lat: 5.6037 + (Math.random() - 0.5) * 0.05,
      lng: -0.1870 + (Math.random() - 0.5) * 0.05,
      image: v.logo_url ?? 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200',
    };
  })
  .filter(v => {
    // API doesn't have categories for vendors, so we just match search for now
    const matchesSearch = v.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  })
  .sort((a, b) => a.distanceKm - b.distanceKm);

  // OSM URL
  const centerLat = userLocation?.latitude ?? 5.6037;
  const centerLng = userLocation?.longitude ?? -0.187;
  const delta = 0.06;
  const bbox = `${centerLng - delta}%2C${centerLat - delta}%2C${centerLng + delta}%2C${centerLat + delta}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;

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
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surfaceSoft, borderRadius: 16, paddingHorizontal: 16, height: 48,
            borderWidth: 1, borderColor: colors.surfaceMuted,
          }}>
            <Ionicons name="search" size={20} color={colors.inkGhost} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search vendors..."
              placeholderTextColor={colors.inkGhost}
              style={{ flex: 1, marginLeft: 10, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
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
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: activeCategory === cat ? colors.ink : colors.surface,
                  borderWidth: 1, borderColor: activeCategory === cat ? colors.ink : colors.surfaceMuted,
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: activeCategory === cat ? colors.surface : colors.inkSoft }}>{cat}</Text>
              </Pressable>
            ))}
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
            {loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <ActivityIndicator size="large" color={colors.primaryDim} />
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>Locating vendors…</Text>
              </View>
            ) : Platform.OS === 'web' ? (
              // @ts-ignore
              <iframe
                src={osmUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Vendor Map"
              />
            ) : MapView ? (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: centerLat,
                  longitude: centerLng,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                {/* User Pin */}
                {userLocation && (
                  <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} title="You are here">
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.info, borderWidth: 3, borderColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 }} />
                  </Marker>
                )}
                {/* Vendor Pins */}
                {processedVendors.map(vendor => (
                  <Marker
                    key={vendor.id}
                    coordinate={{ latitude: vendor.lat, longitude: vendor.lng }}
                    title={vendor.store_name}
                    description={`${vendor.distanceKm.toFixed(1)} km away • ~${vendor.etaMins} mins`}
                    onPress={() => setSelectedVendor(vendor.id)}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: selectedVendor === vendor.id ? colors.ink : colors.surface, borderWidth: 2, borderColor: selectedVendor === vendor.id ? '#ffffff' : colors.primaryDim, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
                      <Ionicons name="storefront" size={16} color={selectedVendor === vendor.id ? '#ffffff' : colors.primaryDim} />
                    </View>
                  </Marker>
                ))}
              </MapView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="map" size={40} color={colors.primaryDim} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 8 }}>Map View</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', lineHeight: 22 }}>
                  Map rendering requires linking react-native-maps natively.
                </Text>
              </View>
            )}

            {/* Selected Vendor Preview Card (Mobile Map View) */}
            {!isDesktop && viewMode === 'map' && selectedVendor && (
              <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                {(() => {
                  const v = processedVendors.find(x => x.id === selectedVendor);
                  if (!v) return null;
                  return (
                    <Pressable
                      onPress={() => router.push(`/vendor/${v.id}` as any)}
                      style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 }}
                    >
                      <Image source={{ uri: v.image }} style={{ width: 60, height: 60, borderRadius: 14, marginRight: 14 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 4 }} numberOfLines={1}>{v.store_name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="time" size={12} color={colors.inkMuted} />
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkMuted }}>~{v.etaMins} mins</Text>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkGhost }}>•</Text>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: v.isOpen ? colors.success : colors.error }}>{v.isOpen ? 'Open' : 'Closed'}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.inkGhost} />
                    </Pressable>
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
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{processedVendors.length} vendors nearby</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              {processedVendors.map(vendor => {
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
                    <Image source={{ uri: vendor.image }} style={{ width: 56, height: 56, borderRadius: 14, marginRight: 14, backgroundColor: colors.surfaceMuted }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }} numberOfLines={1}>
                        {vendor.store_name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkSoft }}>Store</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>•</Text>
                        <Ionicons name="star" size={11} color={colors.warning} />
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.inkSoft }}>{vendor.avg_rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                        <Ionicons name="bicycle" size={12} color={badge.text} style={{ marginRight: 4 }} />
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: badge.text }}>~{vendor.etaMins}m</Text>
                      </View>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost }}>{vendor.distanceKm.toFixed(1)} km</Text>
                    </View>
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
