import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { WebHeader } from '../components/WebHeader';
import { useToast } from '../context/ToastContext';
import { useCartStore } from '../store/cartStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocalOrder } from '../api/localOrders';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { MapView } from '../components/Map/MapView';
import { MapMarker } from '../components/Map/MapMarker';
import { LocationSearchModal, LocationResult } from '../components/LocationSearchModal';
import { useLocationStore } from '../store/locationStore';
import * as Location from 'expo-location';

async function reverseGeocodeAddress(lat: number, lng: number) {
  if (Platform.OS === 'web') {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'NienaEmporium/1.0' } }
    );
    const data = await res.json();
    const a = data?.address;
    return {
      street: `${a?.house_number || ''} ${a?.road || ''}`.trim() || 'Unknown Street',
      city: `${a?.city || a?.town || a?.village || ''}, ${a?.state || ''} ${a?.postcode || ''}`.trim(),
    };
  } else {
    return null;
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  lat?: number;
  lng?: number;
  landmark?: string;
  isDefault?: boolean;
}

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { showToast } = useToast();
  const clearCart = useCartStore(state => state.clearCart);
  const cartItems = useCartStore(state => state.items);
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const queryClient = useQueryClient();
  const { token } = React.useContext(AuthContext);

  // Checkout is a single step: Address → Place Order → Confirmation
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [deliveryPin, setDeliveryPin] = useState<string | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({ latitude: 5.6037, longitude: -0.1870 });
  const [mapReady, setMapReady] = useState(false);

  const { latitude: liveLat, longitude: liveLng, status: locationStatus } = useLocationStore();

  useEffect(() => {
    if (liveLat && liveLng && !mapReady) {
      setMapCenter({ latitude: liveLat, longitude: liveLng });
      setMapReady(true);
    } else if (locationStatus === 'error' || locationStatus === 'denied') {
      setMapReady(true);
    }
  }, [liveLat, liveLng, locationStatus, mapReady]);

  const subtotal = getSubtotal();

  const selectedAddressIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const addrData = await AsyncStorage.getItem('@user_addresses');
        const addrs: Address[] = addrData ? JSON.parse(addrData) : [];
        setAddresses(addrs);
        if (!selectedAddressIdRef.current) {
          const defaultAddr = addrs.find(a => a.isDefault) ?? addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            selectedAddressIdRef.current = defaultAddr.id;
          }
        }
      } catch (e) {
        console.error('Failed to load checkout data', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address.', 'warning');
      return;
    }
    if (!phone) {
      showToast('Please provide a phone number for delivery.', 'warning');
      return;
    }
    if (cartItems.length === 0) {
      showToast('Your cart is empty.', 'warning');
      return;
    }

    setIsPlacing(true);
    try {
      const orderPayload = {
        shipping_address: {
          name: selectedAddress?.name ?? '',
          street: selectedAddress?.street ?? '',
          city: selectedAddress?.city ?? '',
          phone: phone,
          landmark: landmark,
        },
        notes: null,
        items: cartItems.map(item => ({
          product_id: item.productId || item.id,
          quantity: item.quantity,
          color_chosen: null,
          selected_attributes: item.selectedAttributes,
        })),
      };

      const res = await fetch(`${BASE_URL}/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        let detail: any;
        try { detail = await res.json(); } catch { detail = { detail: res.statusText }; }
        let errorMsg = detail?.detail;
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg.map((e: any) => e.msg).join(', ');
        }
        throw new Error(errorMsg ?? `Order failed (${res.status})`);
      }

      const backendOrder = await res.json();
      const realRef = backendOrder.id.slice(-8).toUpperCase();
      setOrderRef(realRef);
      setDeliveryPin(backendOrder.delivery_pin ?? null);

      const now = new Date().toISOString();
      await saveLocalOrder({
        id: backendOrder.id,
        ref: realRef,
        status: backendOrder.status,
        subtotal,
        shipping_fee: 0,
        total_amount: subtotal,
        delivery_pin: backendOrder.delivery_pin,
        discount_amount: backendOrder.discount_amount ?? 0,
        shipping_address: {
          name: selectedAddress?.name ?? '',
          street: selectedAddress?.street ?? '',
          city: selectedAddress?.city ?? '',
          lat: selectedAddress?.lat,
          lng: selectedAddress?.lng,
          phone: phone,
          landmark: landmark,
        },
        vendor_id: cartItems[0]?.vendorId ?? '',
        payment: { type: 'cash_on_delivery', last4: '' },
        items: cartItems.map(item => ({
          id: `item-${item.id}`,
          product_id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          unit_price: item.price,
          discount_price: item.salePrice ?? null,
        })),
        created_at: backendOrder.created_at ?? now,
        updated_at: backendOrder.updated_at ?? now,
      });

      clearCart();
      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      showToast('Order placed! Show your PIN to the vendor on delivery.', 'success');
      setStep(2);
    } catch (err: any) {
      showToast(err?.message ?? 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {isDesktop && <WebHeader />}

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, flex: 1 }}>Checkout</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, maxWidth: 600, alignSelf: 'center', width: '100%' }}>

        {/* ─── Step 1: Address + Place Order ─── */}
        {step === 1 && (
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 4 }}>Delivery Address</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
              The vendor will deliver to this location. You'll pay them in cash upon delivery.
            </Text>

            {/* Map */}
            <View style={{ height: 220, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              {mapReady ? (
                <MapView
                  style={{ flex: 1, width: '100%', height: '100%' }}
                  mapStyle="https://tiles.openfreemap.org/styles/liberty"
                  initialRegion={{
                    latitude: selectedAddress?.lat ?? mapCenter.latitude,
                    longitude: selectedAddress?.lng ?? mapCenter.longitude,
                    zoom: 14
                  }}
                  showUserLocation
                  onPress={async (feature) => {
                    if (feature?.geometry?.coordinates) {
                      const [lng, lat] = feature.geometry.coordinates;
                      let street = 'Selected Location';
                      let city = '';
                      const webResult = await reverseGeocodeAddress(lat, lng);
                      if (webResult) {
                        street = webResult.street;
                        city = webResult.city;
                      } else {
                        try {
                          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                          if (geocode.length > 0) {
                            const place = geocode[0];
                            street = `${place.streetNumber || ''} ${place.street || ''}`.trim() || 'Selected Location';
                            city = `${place.city || ''}, ${place.region || ''} ${place.postalCode || ''}`.trim();
                          }
                        } catch (e) { }
                      }
                      const newId = Date.now().toString();
                      const newAddr = { id: newId, name: 'Pinned Location', street, city, lat, lng };
                      setAddresses(prev => [newAddr, ...prev]);
                      setSelectedAddressId(newId);
                    }
                  }}
                >
                  {selectedAddress && selectedAddress.lat && selectedAddress.lng && (
                    <MapMarker
                      id="selected-address"
                      coordinate={[selectedAddress.lng, selectedAddress.lat]}
                      title={selectedAddress.name}
                    >
                      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Ionicons name="location" size={40} color={colors.primary} style={Platform.OS === 'web' ? { filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' } as any : { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }} />
                      </View>
                    </MapMarker>
                  )}
                </MapView>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft }}>
                  <ActivityIndicator size="large" color={colors.primaryDim} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 8 }}>Locating you…</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => setShowLocationSearch(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
                padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 16
              })}
            >
              <Ionicons name="search" size={20} color={colors.ink} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Search for Address</Text>
            </Pressable>

            {addresses.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 16 }}>
                <Ionicons name="location-outline" size={36} color={colors.surfaceMuted} style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkMuted }}>No saved addresses</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 4, textAlign: 'center' }}>
                  Tap the map or search above to set your delivery location
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 200, marginBottom: 16 }} nestedScrollEnabled>
                <View style={{ gap: 12 }}>
                  {addresses.map(addr => {
                    const sel = addr.id === selectedAddressId;
                    return (
                      <Pressable key={addr.id} onPress={() => setSelectedAddressId(addr.id)} style={{
                        backgroundColor: colors.surface, borderRadius: 16, padding: 16,
                        borderWidth: 1.5, borderColor: sel ? colors.primary : colors.surfaceMuted,
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name={addr.name === 'Home' ? 'home' : 'location'} size={16} color={sel ? colors.primaryDim : colors.ink} style={{ marginRight: 8 }} />
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>{addr.name}</Text>
                          </View>
                          {sel && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                        </View>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>{addr.street}</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>{addr.city}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Phone Number</Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48,
                  borderWidth: 1, borderColor: colors.surfaceMuted, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink,
                  ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) as any
                }}
                placeholder="e.g. 055 123 4567"
                placeholderTextColor={colors.inkGhost}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Landmark (Optional)</Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48,
                  borderWidth: 1, borderColor: colors.surfaceMuted, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
                  ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) as any
                }}
                placeholder="e.g. Near the big bus stop"
                placeholderTextColor={colors.inkGhost}
                value={landmark}
                onChangeText={setLandmark}
              />
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 4 }}>
                Help the vendor locate you easily.
              </Text>
            </View>

            {/* Order Summary */}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Order Summary</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 8 }}>
              {cartItems.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink, flex: 1, marginRight: 8 }} numberOfLines={1}>{item.name} × {item.quantity}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>GH₵{((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Total (Pay on Delivery)</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>GH₵{subtotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Cash on delivery info banner */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.infoGhost, borderRadius: 14, padding: 14, marginBottom: 24 }}>
              <Ionicons name="cash-outline" size={20} color={colors.info} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.info, lineHeight: 20 }}>
                You'll pay <Text style={{ fontFamily: 'Inter_700Bold' }}>GH₵{subtotal.toFixed(2)}</Text> directly to the vendor when they deliver your order.
              </Text>
            </View>

            <Button
              title={isPlacing ? 'Placing Order…' : 'Place Order'}
              onPress={handlePlaceOrder}
              disabled={isPlacing}
            />
          </View>
        )}

        {/* ─── Step 2: Confirmation with PIN ─── */}
        {step === 2 && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark" size={44} color={colors.primaryDim} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, marginBottom: 8 }}>Order Placed!</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.primaryDim, marginBottom: 4 }}>#{orderRef}</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 320 }}>
              Your order is confirmed. The vendor will contact you to arrange delivery. Pay in cash when they arrive.
            </Text>

            {/* Delivery PIN */}
            {deliveryPin && (
              <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 2, borderColor: colors.primaryBorder, marginBottom: 28, alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Ionicons name="shield-checkmark" size={28} color={colors.primaryDim} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 6 }}>Your Delivery PIN</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginBottom: 20, maxWidth: 280, lineHeight: 20 }}>
                  Show this code to the vendor when they deliver your order and hand it to you. Do not share it before delivery.
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                  {deliveryPin.split('').map((digit, i) => (
                    <View key={i} style={{
                      width: 60, height: 72, borderRadius: 16,
                      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
                    }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 34, color: '#222022' }}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warningGhost, borderRadius: 12, padding: 12 }}>
                  <Ionicons name="information-circle" size={16} color={colors.warning} />
                  <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.warning, lineHeight: 18 }}>
                    The vendor enters this code on their app to confirm delivery was completed.
                  </Text>
                </View>
              </View>
            )}

            <View style={{ width: '100%', gap: 12 }}>
              <Button title="View My Orders" onPress={() => router.replace('/profile/orders' as any)} />
              <Pressable onPress={() => router.replace('/(tabs)')} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Continue Shopping</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <LocationSearchModal
        visible={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={(loc: LocationResult) => {
          const newId = Date.now().toString();
          const newAddr = { id: newId, name: loc.name, street: loc.street, city: loc.city, lat: loc.lat, lng: loc.lon };
          setAddresses(prev => [newAddr, ...prev]);
          setSelectedAddressId(newId);
          setShowLocationSearch(false);
        }}
      />
    </SafeAreaView>
  );
}
