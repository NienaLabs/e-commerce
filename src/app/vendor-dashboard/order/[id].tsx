import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Platform, useWindowDimensions,
  Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { getVendorOrderDetail } from '../../../api/vendors';
import { useWsEvent } from '../../../context/WebSocketContext';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'New Order',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

// Real PIN verification happens at the backend

export default function VendorOrderDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const orderId = Array.isArray(id) ? id[0] : id;

  // Track in-flight status update requests so we can abort them on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      // Cancel any pending status PATCH when the screen is unmounted (e.g. go back)
      abortControllerRef.current?.abort();
    };
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-order', orderId],
    queryFn: () => getVendorOrderDetail(token!, orderId!),
    enabled: !!token && !!orderId,
  });

  // Real-time status updates via WebSocket
  useWsEvent('order_status_changed', (event) => {
    if (event.order_id === orderId) {
      queryClient.invalidateQueries({ queryKey: ['vendor-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    }
  });

  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (order?.status) setCurrentStatus(order.status);
  }, [order?.status]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // No local pin code comparison needed, verify with backend.
  const STATUS_CFG: Record<string, { bg: string; text: string }> = {
    pending: { bg: colors.infoGhost, text: colors.info },
    confirmed: { bg: colors.primaryGhost, text: colors.primaryDim },
    processing: { bg: colors.warningGhost, text: colors.warning },
    shipped: { bg: colors.primaryGhost, text: colors.primaryDim },
    delivered: { bg: colors.successGhost, text: colors.success },
    cancelled: { bg: colors.errorGhost, text: colors.error },
    refunded: { bg: colors.errorGhost, text: colors.error },
  };

  const cfg = STATUS_CFG[currentStatus] || STATUS_CFG.pending;
  const canVerifyDelivery = currentStatus === 'shipped';

  const updateStatus = async (newStatus: string) => {
    if (newStatus === 'delivered') return; // Must go through PIN verification
    if (newStatus === currentStatus) return; // Already at this status — nothing to do
    if (statusSaving) return;

    const previousStatus = currentStatus;
    setCurrentStatus(newStatus); // optimistic update
    setStatusError(null);
    setStatusSaving(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
      const res = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Failed to update status (${res.status})`);
      }

      queryClient.invalidateQueries({ queryKey: ['vendor-order', order.id] });
      // Use an exact prefix match so only vendor-orders queries are invalidated
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'], exact: false });
    } catch (e: any) {
      // Ignore abort errors — they happen on normal navigation
      if (e?.name === 'AbortError') return;
      // Revert the optimistic update on failure
      setCurrentStatus(previousStatus);
      setStatusError(e.message || 'Failed to update status. Please try again.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleVerifyPin = async () => {
    try {
      const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
      const res = await fetch(`${BASE_URL}/orders/${order.id}/verify-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: pinInput })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Incorrect delivery PIN');
      }

      setVerifySuccess(true);
      setPinError('');
      setCurrentStatus('delivered');
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-order', order.id] });

      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySuccess(false);
        setPinInput('');
      }, 2000);
    } catch (e: any) {
      setPinError(e.message || 'Incorrect delivery PIN');
      setPinInput('');
    }
  };

  const handleCloseModal = () => {
    setShowVerifyModal(false);
    setPinInput('');
    setPinError('');
    setVerifySuccess(false);
  };

  // Calculate order subtotal for ONLY the vendor's items in this order
  const vendorTotal = order.items.reduce((acc: number, item: any) => acc + ((item.discount_price ?? item.unit_price) * item.quantity), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.push('/vendor-dashboard/orders' as any)}
          style={{ marginRight: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Order #{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>{new Date(order.created_at).toLocaleString()}</Text>
        </View>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{STATUS_LABELS[currentStatus] || currentStatus}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20, gap: 16,
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: 'flex-start',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Left Column ─── */}
        <View style={{ flex: 1, gap: 16, width: isDesktop ? undefined : '100%' }}>

          {/* Delivery Code Banner — visible when out for delivery */}
          {canVerifyDelivery && (
            <View style={{
              borderRadius: 20, overflow: 'hidden',
              backgroundColor: colors.primary,
              padding: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.ink} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>Delivery Verification Required</Text>
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.ink, lineHeight: 20, marginBottom: 16 }}>
                When the driver reaches the customer, ask for their 4-digit delivery code to confirm successful delivery.
              </Text>
              <Pressable
                onPress={() => setShowVerifyModal(true)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                })}
              >
                <Ionicons name="keypad" size={20} color={colors.ink} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Enter Customer PIN</Text>
              </Pressable>
            </View>
          )}

          {/* Delivered confirmation */}
          {currentStatus === 'delivered' && (
            <View style={{
              borderRadius: 20, backgroundColor: '#dcfce7',
              padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={28} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#166534' }}>Delivery Confirmed!</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#15803d', marginTop: 2 }}>
                  Customer PIN was verified successfully.
                </Text>
              </View>
            </View>
          )}

          {/* Order Summary / Dispatch Info */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="document-text" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Order Summary / Dispatch Info</Text>
            </View>

            {/* Customer Details */}
            <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkGhost, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Customer Details</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="person-outline" size={16} color={colors.inkMuted} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>{order.shipping_address?.name || 'Customer'}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="call-outline" size={16} color={colors.inkMuted} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink }}>
                  {order.shipping_address?.phone || 'No phone number provided'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: order.shipping_address?.landmark ? 8 : 0 }}>
                <Ionicons name="location-outline" size={16} color={colors.inkMuted} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink, flex: 1, lineHeight: 22 }}>
                  {order.shipping_address?.street}{'\n'}{order.shipping_address?.city}
                </Text>
              </View>

              {order.shipping_address?.landmark ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="flag-outline" size={16} color={colors.inkMuted} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, flex: 1 }}>
                    Landmark: {order.shipping_address.landmark}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Order Items */}
            <View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkGhost, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Items Ordered</Text>
              {order.items.map((item: any) => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>
                      {item.product_name ?? `Product #${(item.product_id ?? '').slice(0, 8).toUpperCase()}`}
                    </Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 2 }}>
                      Quantity: {item.quantity} {item.color_chosen ? `· Color: ${item.color_chosen}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>
                    ${((item.discount_price ?? item.unit_price) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Total Amount</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.primaryDim }}>${vendorTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Right Column: Status Update ─── */}
        <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', gap: 16 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Update Order Status</Text>
            <View style={{ gap: 8 }}>
              {/* Status error banner */}
              {statusError && (
                <View style={{
                  backgroundColor: colors.errorGhost, borderRadius: 12,
                  padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
                }}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.error }}>
                    {statusError}
                  </Text>
                  <Pressable onPress={() => setStatusError(null)}>
                    <Ionicons name="close" size={16} color={colors.error} />
                  </Pressable>
                </View>
              )}
              {STATUSES.filter(s => s !== 'delivered').map(status => {
                const isCurrent = status === currentStatus;
                const isPast = STATUSES.indexOf(status) < STATUSES.indexOf(currentStatus);
                // Disable if: already at this status, order is delivered, or a save is in progress
                const isDisabled = isCurrent || currentStatus === 'delivered' || statusSaving;
                return (
                  <Pressable
                    key={status}
                    onPress={() => updateStatus(status)}
                    disabled={isDisabled}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                      backgroundColor: isCurrent ? colors.ink : colors.surfaceSoft,
                      borderWidth: 1.5, borderColor: isCurrent ? colors.ink : colors.surfaceMuted,
                      opacity: isDisabled && !isCurrent ? 0.5 : 1,
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isCurrent ? colors.primary : (isPast ? colors.ink : colors.surfaceMuted),
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      {(isCurrent || isPast) && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isCurrent ? colors.primary : colors.ink }} />
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: isCurrent ? colors.surface : (isPast ? colors.ink : colors.inkGhost) }}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Delivered row — only via PIN */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                backgroundColor: currentStatus === 'delivered' ? '#dcfce7' : colors.surfaceSoft,
                borderWidth: 1.5, borderColor: currentStatus === 'delivered' ? '#16a34a' : colors.surfaceMuted,
              }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: currentStatus === 'delivered' ? '#16a34a' : colors.surfaceMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  {currentStatus === 'delivered' && (
                    <Ionicons name="checkmark" size={13} color="#16a34a" />
                  )}
                </View>
                <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: currentStatus === 'delivered' ? '#166534' : colors.inkGhost }}>
                  Delivered
                </Text>
                <View style={{ backgroundColor: colors.warningGhost, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.warning }}>PIN REQUIRED</Text>
                </View>
              </View>
            </View>
          </View>

          {canVerifyDelivery && (
            <Pressable
              onPress={() => setShowVerifyModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDim : colors.primary,
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              })}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.ink} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Verify Delivery with PIN</Text>
            </Pressable>
          )}

          <Pressable
            onPress={async () => {
              // Wait for any in-flight status update to finish before navigating away
              if (router.canGoBack()) router.back();
              else router.push('/vendor-dashboard/orders' as any);
            }}
            style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceMuted }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>
              {statusSaving ? 'Saving…' : 'Go Back'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── PIN Verify Modal ─── */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={handleCloseModal}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28,
              paddingBottom: 40,
            }}
          >
            {verifySuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, marginBottom: 8 }}>Delivery Confirmed!</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>
                  The order has been marked as delivered.
                </Text>
              </View>
            ) : (
              <>
                {/* Handle */}
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignSelf: 'center', marginBottom: 24 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name="shield-checkmark" size={22} color={colors.primaryDim} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Enter Delivery PIN</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Ask the customer for their code</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 20 }} />

                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>
                  4-Digit Delivery Code
                </Text>

                {/* PIN Input */}
                <TextInput
                  value={pinInput}
                  onChangeText={text => {
                    setPinError('');
                    if (text.length <= 4 && /^\d*$/.test(text)) setPinInput(text);
                  }}
                  placeholder="· · · ·"
                  placeholderTextColor={colors.inkGhost}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={false}
                  style={{
                    backgroundColor: colors.surfaceSoft,
                    borderRadius: 16, borderWidth: 2,
                    borderColor: pinError ? colors.error : pinInput.length === 4 ? colors.primary : colors.surfaceMuted,
                    paddingHorizontal: 24, paddingVertical: 20,
                    fontFamily: 'Inter_700Bold', fontSize: 36,
                    color: colors.ink, textAlign: 'center',
                    letterSpacing: 16,
                    marginBottom: 8,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  }}
                />

                {pinError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#dc2626', flex: 1 }}>{pinError}</Text>
                  </View>
                ) : (
                  <View style={{ height: 16 }} />
                )}

                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textAlign: 'center', marginBottom: 20 }}>
                  The customer received this code after payment. Both parties must agree before confirming delivery.
                </Text>

                <Pressable
                  onPress={handleVerifyPin}
                  disabled={pinInput.length < 4}
                  style={({ pressed }) => ({
                    backgroundColor: pinInput.length < 4 ? colors.surfaceMuted : (pressed ? colors.primaryDim : colors.primary),
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: pinInput.length < 4 ? colors.inkGhost : colors.ink }}>
                    Confirm Delivery
                  </Text>
                </Pressable>

                <Pressable onPress={handleCloseModal} style={{ paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
