import React, { useState, useEffect, useContext, useCallback } from 'react';
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
import * as Location from 'expo-location';

async function reverseGeocodeAddress(lat: number, lng: number) {
  if (Platform.OS === 'web') {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ElectricApp/1.0' } }
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

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiry: string;
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

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [landmark, setLandmark] = useState('');
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({ latitude: 5.6037, longitude: -0.1870 });
  const [mapReady, setMapReady] = useState(false);

  // Fetch user location once on mount to center the map
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setMapCenter({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        // silently fall back to default Accra coords
      } finally {
        setMapReady(true);
      }
    })();
  }, []);

  const SHIPPING_FEE = 4.99;
  const subtotal = getSubtotal();
  const total = subtotal + SHIPPING_FEE;

  const selectedAddressIdRef = React.useRef<string | null>(null);
  const selectedPaymentIdRef = React.useRef<string | null>(null);

  // Load saved addresses & payments once on mount only — NOT on every focus,
  // so that in-memory pinned addresses don't get wiped by a re-load.
  useEffect(() => {
    async function loadData() {
      try {
        const [addrData, payData] = await Promise.all([
          AsyncStorage.getItem('@user_addresses'),
          AsyncStorage.getItem('@user_payments'),
        ]);
        const addrs: Address[] = addrData ? JSON.parse(addrData) : [];
        const pays: PaymentMethod[] = payData ? JSON.parse(payData) : [];

        setAddresses(addrs);
        setPayments(pays);

        // Auto-select default only if nothing is selected yet
        if (!selectedAddressIdRef.current) {
          const defaultAddr = addrs.find(a => a.isDefault) ?? addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            selectedAddressIdRef.current = defaultAddr.id;
          }
        }
        if (!selectedPaymentIdRef.current) {
          const defaultPay = pays.find(p => p.isDefault) ?? pays[0];
          if (defaultPay) {
            setSelectedPaymentId(defaultPay.id);
            selectedPaymentIdRef.current = defaultPay.id;
          }
        }
      } catch (e) {
        console.error('Failed to load checkout data', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []); // empty deps — run once on mount only

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const selectedPayment = payments.find(p => p.id === selectedPaymentId);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a shipping address.', 'warning');
      return;
    }
    if (!selectedPaymentId) {
      showToast('Please select a payment method.', 'warning');
      return;
    }
    if (cartItems.length === 0) {
      showToast('Your cart is empty.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Build the backend order payload
      const orderPayload = {
        shipping_address: {
          name: selectedAddress?.name ?? '',
          street: selectedAddress?.street ?? '',
          city: selectedAddress?.city ?? '',
        },
        notes: null,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          color_chosen: null,
        })),
      };

      // POST to the real backend
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

      // Also save a local copy for offline order-tracking page
      const now = new Date().toISOString();
      await saveLocalOrder({
        id: backendOrder.id,
        ref: realRef,
        status: backendOrder.status,
        subtotal,
        shipping_fee: SHIPPING_FEE,
        total_amount: total,
        delivery_pin: backendOrder.delivery_pin,
        discount_amount: backendOrder.discount_amount ?? 0,
        shipping_address: {
          name: selectedAddress?.name ?? '',
          street: selectedAddress?.street ?? '',
          city: selectedAddress?.city ?? '',
          lat: selectedAddress?.lat,
          lng: selectedAddress?.lng,
          landmark: landmark,
        },
        vendor_id: cartItems[0]?.vendorId ?? '',
        payment: {
          type: selectedPayment?.type ?? '',
          last4: selectedPayment?.last4 ?? '',
        },
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

      // Clear the cart and refresh queries
      clearCart();
      
      if (selectedAddress?.lat && selectedAddress?.lng) {
        await AsyncStorage.setItem('@active_delivery', JSON.stringify({
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
          vendorId: cartItems[0]?.vendorId ?? ''
        }));
      }

      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      showToast('Order placed successfully!', 'success');
      setStep(3);
    } catch (err: any) {
      showToast(err?.message ?? 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsLoading(false);
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

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, flex: 1 }}>Checkout</Text>

        {/* Step indicator */}
        {step < 3 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s <= step ? colors.ink : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: s <= step ? colors.surface : colors.inkGhost }}>{s}</Text>
                </View>
                {s < 2 && <View style={{ width: 20, height: 2, backgroundColor: step > 1 ? colors.ink : colors.surfaceMuted, borderRadius: 1 }} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, maxWidth: 600, alignSelf: 'center', width: '100%' }}>

        {/* ─── Step 1: Address ─── */}
        {step === 1 && (
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Shipping Address</Text>

            {/* Map Container */}
            <View style={{ height: 250, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
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
                        } catch (e) {}
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

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Landmark (Optional, but recommended)</Text>
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
                Help the vendor locate you easily in case they find it difficult to track your current location.
              </Text>
            </View>

            <Button title="Continue to Payment" onPress={() => {
              if (!selectedAddressId) { showToast('Please select a shipping address.', 'warning'); return; }
              setStep(2);
            }} />
          </View>
        )}

        {/* ─── Step 2: Payment + Summary ─── */}
        {step === 2 && (
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Payment Method</Text>

            {payments.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 16 }}>
                <Ionicons name="card-outline" size={36} color={colors.surfaceMuted} style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkMuted }}>No saved payment methods</Text>
              </View>
            ) : (
              <View style={{ gap: 12, marginBottom: 16 }}>
                {payments.map(pay => {
                  const sel = pay.id === selectedPaymentId;
                  return (
                    <Pressable key={pay.id} onPress={() => setSelectedPaymentId(pay.id)} style={{
                      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
                      borderWidth: 1.5, borderColor: sel ? colors.primary : colors.surfaceMuted,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="card" size={20} color={sel ? colors.primaryDim : colors.ink} style={{ marginRight: 12 }} />
                          <View>
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>{pay.type} •••• {pay.last4}</Text>
                            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>Expires {pay.expiry}</Text>
                          </View>
                        </View>
                        {sel && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable onPress={() => router.push('/profile/payments' as any)} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted, borderStyle: 'dashed', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>+ Add Payment Method</Text>
            </Pressable>

            {/* Order Summary */}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 12 }}>Order Summary</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 8 }}>
              {cartItems.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink, flex: 1, marginRight: 8 }} numberOfLines={1}>{item.name} × {item.quantity}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>Subtotal</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>Shipping</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>${SHIPPING_FEE.toFixed(2)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Total</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {selectedAddress && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 }}>
                <Ionicons name="location" size={14} color={colors.inkGhost} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Delivering to: {selectedAddress.name} — {selectedAddress.street}</Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
              <Button title="Place Order" onPress={handlePlaceOrder} />
              <Pressable onPress={() => setStep(1)} style={{ padding: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>← Back to Address</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Step 3: Confirmation ─── */}
        {step === 3 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark" size={44} color={colors.primaryDim} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, marginBottom: 8 }}>Order Confirmed!</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.primaryDim, marginBottom: 12 }}>#{orderRef}</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32, maxWidth: 320 }}>
              Your order has been placed successfully. You'll receive updates on your order status shortly.
            </Text>
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
