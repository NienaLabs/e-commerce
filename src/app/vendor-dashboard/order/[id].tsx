import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Platform,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { getVendorOrderDetail } from '../../../api/vendors';
import { useWsEvent } from '../../../context/WebSocketContext';
import { Header, Card, Badge, Btn, Divider, font, shadow, useResponsive } from '../../../components/vendor/kit';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'New Order', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

/**
 * Mirrors VALID_TRANSITIONS in the backend (app/routers/orders.py). Without
 * this the UI happily offers moves the server rejects with a 400 — the status
 * appeared to change, then snapped back a moment later.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'processing', 'shipped', 'cancelled'],
  confirmed: ['pending', 'processing', 'shipped', 'cancelled'],
  processing: ['pending', 'confirmed', 'shipped', 'cancelled'],
  shipped: ['pending', 'confirmed', 'processing', 'delivered'],
  delivered: ['refunded'],
  cancelled: ['pending', 'confirmed'],
  refunded: [],
};
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
const STATUS_TONE: Record<string, Tone> = {
  pending: 'info', confirmed: 'primary', processing: 'warning', shipped: 'info',
  delivered: 'success', cancelled: 'error', refunded: 'warning',
};

export default function VendorOrderDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const orderId = Array.isArray(id) ? id[0] : id;

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-order', orderId],
    queryFn: () => getVendorOrderDetail(token!, orderId!),
    enabled: !!token && !!orderId,
  });

  useWsEvent('order_status_changed', (event) => {
    if (event.order_id === orderId) {
      queryClient.invalidateQueries({ queryKey: ['vendor-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    }
  });

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  /**
   * Writes the new status into the React Query cache — both this order's detail
   * and every cached orders list — and hands back a rollback closure.
   *
   * Updating the list cache too is what makes the change survive navigating
   * back: the list renders from cache and only refetches afterwards.
   */
  const applyStatusToCaches = (newStatus: string) => {
    const previousDetail = queryClient.getQueryData(['vendor-order', orderId]);
    const previousLists = queryClient.getQueriesData({ queryKey: ['vendor-orders'] });

    queryClient.setQueryData(['vendor-order', orderId], (old: any) =>
      old ? { ...old, status: newStatus } : old,
    );
    queryClient.setQueriesData({ queryKey: ['vendor-orders'] }, (old: any) =>
      Array.isArray(old) ? old.map((o: any) => (o.id === orderId ? { ...o, status: newStatus } : o)) : old,
    );

    return () => {
      queryClient.setQueryData(['vendor-order', orderId], previousDetail);
      previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
    };
  };

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Failed to update status (${res.status})`);
      }
      return res.json();
    },
    onMutate: async (newStatus: string) => {
      // Stop an in-flight refetch from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey: ['vendor-order', orderId] });
      setStatusError(null);
      return { rollback: applyStatusToCaches(newStatus) };
    },
    onError: (e: any, _newStatus, context) => {
      context?.rollback();
      setStatusError(e?.message || 'Failed to update status. Please try again.');
    },
    onSettled: () => {
      // Reconcile with the server regardless of outcome. The mutation is owned
      // by React Query, so this still runs if the screen has been closed.
      queryClient.invalidateQueries({ queryKey: ['vendor-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Single source of truth: the cached order. No mirrored useState to drift.
  const currentStatus: string = order.status;
  const statusSaving = statusMutation.isPending;
  const canVerifyDelivery = currentStatus === 'shipped';

  const updateStatus = (newStatus: string) => {
    if (newStatus === 'delivered') return; // PIN-only path
    if (newStatus === currentStatus) return;
    if (statusSaving) return;
    if (!(VALID_TRANSITIONS[currentStatus] ?? []).includes(newStatus)) return;
    statusMutation.mutate(newStatus);
  };

  const CANCELLABLE = ['pending', 'confirmed', 'processing'];
  const doCancel = () => updateStatus('cancelled');
  const confirmCancel = () => {
    const msg = 'Cancel this order?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) doCancel();
    } else {
      Alert.alert('Cancel Order', msg, [
        { text: 'Keep Order', style: 'cancel' },
        { text: 'Cancel Order', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  const handleVerifyPin = async () => {
    try {
      const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
      const res = await fetch(`${BASE_URL}/orders/${order.id}/verify-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin: pinInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Incorrect delivery PIN');
      }
      setVerifySuccess(true);
      setPinError('');
      // Same cache-first update as a status change, so the orders list is
      // already correct when the vendor navigates back.
      applyStatusToCaches('delivered');
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-commissions'] });
      setTimeout(() => { setShowVerifyModal(false); setVerifySuccess(false); setPinInput(''); }, 2000);
    } catch (e: any) {
      setPinError(e.message || 'Incorrect delivery PIN');
      setPinInput('');
    }
  };

  const handleCloseModal = () => { setShowVerifyModal(false); setPinInput(''); setPinError(''); setVerifySuccess(false); };

  const vendorTotal = order.items.reduce((acc: number, item: any) => acc + ((item.discount_price ?? item.unit_price) * item.quantity), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <Header
        title={`Order #${order.id.slice(-8).toUpperCase()}`}
        subtitle={new Date(order.created_at).toLocaleString()}
        onBack={() => (router.canGoBack() ? router.back() : router.push('/vendor-dashboard/orders' as any))}
        hideBackOnDesktop={false}
        right={<Badge label={STATUS_LABELS[currentStatus] || currentStatus} tone={STATUS_TONE[currentStatus] ?? 'neutral'} />}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, alignItems: 'center' }}
      >
        <View style={{ width: '100%', maxWidth: 1000, flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
          {/* ── Left column ── */}
          <View style={{ flex: 1, gap: 16, width: isDesktop ? undefined : '100%' }}>
            {canVerifyDelivery && (
              <Card style={{ gap: 12, borderColor: colors.primaryBorder }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryDim} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>Confirm the delivery</Text>
                </View>
                <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>
                  When you hand the item to the customer and they pay you in cash, ask for their 4-digit code and enter it here to mark the order delivered.
                </Text>
                <Btn title="Enter customer PIN" icon="keypad-outline" onPress={() => setShowVerifyModal(true)} />
              </Card>
            )}

            {currentStatus === 'delivered' && (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.successGhost, borderColor: colors.successGhost }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={26} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.success }}>Delivery confirmed</Text>
                  <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>The customer&apos;s PIN was verified successfully.</Text>
                </View>
              </Card>
            )}

            {/* Order summary */}
            <Card style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text-outline" size={20} color={colors.primaryDim} />
                <Text style={{ fontFamily: font.h2, fontSize: 16, color: colors.ink }}>Order summary & dispatch</Text>
              </View>

              <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 14, padding: 16, gap: 10 }}>
                <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 0.5, color: colors.inkMuted, textTransform: 'uppercase' }}>Customer details</Text>
                <Row icon="person-outline" text={order.shipping_address?.name || order.customer_name || 'Customer'} strong colors={colors} />
                <Row icon="call-outline" text={order.shipping_address?.phone || 'No phone number provided'} colors={colors} />
                <Row icon="location-outline" text={`${order.shipping_address?.street ?? ''}\n${order.shipping_address?.city ?? ''}`} colors={colors} />
                {order.shipping_address?.landmark ? (
                  <Row icon="flag-outline" text={`Landmark: ${order.shipping_address.landmark}`} muted colors={colors} />
                ) : null}
              </View>

              <View>
                <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 0.5, color: colors.inkMuted, textTransform: 'uppercase', marginBottom: 12 }}>Items ordered</Text>
                {order.items.map((item: any) => (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>
                        {item.product_name ?? `Product #${(item.product_id ?? '').slice(0, 8).toUpperCase()}`}
                      </Text>
                      <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }}>
                        Qty {item.quantity}{item.color_chosen ? ` · ${item.color_chosen}` : ''}
                      </Text>
                      {item.selected_attributes && Object.keys(item.selected_attributes).length > 0 && (
                        <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkSoft, marginTop: 3, textTransform: 'capitalize' }}>
                          {Object.entries(item.selected_attributes).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontFamily: font.bold, fontSize: 14.5, color: colors.ink }}>
                      ${((item.discount_price ?? item.unit_price) * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <Divider style={{ marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: font.h2, fontSize: 16, color: colors.ink }}>Total</Text>
                  <Text style={{ fontFamily: font.bold, fontSize: 20, color: colors.ink }}>${vendorTotal.toFixed(2)}</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* ── Right column: status ── */}
          <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', gap: 16 }}>
            <Card style={{ gap: 12 }}>
              <Text style={{ fontFamily: font.h2, fontSize: 16, color: colors.ink }}>Update status</Text>

              {statusError && (
                <View style={{ backgroundColor: colors.errorGhost, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={{ flex: 1, fontFamily: font.labelM, fontSize: 12.5, color: colors.error }}>{statusError}</Text>
                  <Pressable onPress={() => setStatusError(null)} hitSlop={8}><Ionicons name="close" size={16} color={colors.error} /></Pressable>
                </View>
              )}

              <View style={{ gap: 8 }}>
                {STATUSES.filter(s => s !== 'delivered').map(status => {
                  const isCurrent = status === currentStatus;
                  const isPast = STATUSES.indexOf(status) < STATUSES.indexOf(currentStatus);
                  // Only offer moves the server will accept — anything else
                  // would flash the new status then bounce back on the 400.
                  const isAllowed = (VALID_TRANSITIONS[currentStatus] ?? []).includes(status);
                  const isDisabled = isCurrent || !isAllowed || statusSaving;
                  const isSavingThis = statusSaving && statusMutation.variables === status;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => updateStatus(status)}
                      disabled={isDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isCurrent, disabled: isDisabled }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12,
                        backgroundColor: isCurrent ? colors.ink : colors.surfaceSoft,
                        borderWidth: 1.5, borderColor: isCurrent ? colors.ink : colors.surfaceMuted,
                        opacity: isDisabled && !isCurrent ? 0.55 : 1,
                      }}
                    >
                      <View style={{
                        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                        borderColor: isCurrent ? colors.primary : (isPast ? colors.primary : colors.surfaceDeep),
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {(isCurrent || isPast) && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                      </View>
                      <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 14, color: isCurrent ? colors.surface : (isPast ? colors.ink : colors.inkMuted) }}>
                        {STATUS_LABELS[status]}
                      </Text>
                      {isSavingThis && <ActivityIndicator size="small" color={colors.primary} />}
                    </Pressable>
                  );
                })}

                {/* Delivered row — PIN only */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12,
                  backgroundColor: currentStatus === 'delivered' ? colors.successGhost : colors.surfaceSoft,
                  borderWidth: 1.5, borderColor: currentStatus === 'delivered' ? colors.success : colors.surfaceMuted,
                }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                    borderColor: currentStatus === 'delivered' ? colors.success : colors.surfaceDeep,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {currentStatus === 'delivered' && <Ionicons name="checkmark" size={13} color={colors.success} />}
                  </View>
                  <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 14, color: currentStatus === 'delivered' ? colors.success : colors.inkMuted }}>Delivered</Text>
                  <Badge label="PIN required" tone="warning" />
                </View>
              </View>
            </Card>

            {canVerifyDelivery && (
              <Btn title="Verify delivery with PIN" icon="checkmark-circle-outline" onPress={() => setShowVerifyModal(true)} fullWidth />
            )}
            {CANCELLABLE.includes(currentStatus) && (
              <Btn title="Cancel order" icon="close-circle-outline" variant="destructive" onPress={confirmCancel} disabled={statusSaving} fullWidth />
            )}
            <Btn title={statusSaving ? 'Saving…' : 'Go back'} variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.push('/vendor-dashboard/orders' as any))} fullWidth />
          </View>
        </View>
      </ScrollView>

      {/* ── PIN modal ── */}
      <Modal visible={showVerifyModal} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(34,32,34,0.5)', justifyContent: 'flex-end' }} onPress={handleCloseModal}>
          <Pressable onPress={e => e.stopPropagation()} style={[{ backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 26, paddingBottom: 40 }, shadow(4)]}>
            {verifySuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                </View>
                <Text style={{ fontFamily: font.h1, fontSize: 22, color: colors.ink, marginBottom: 6 }}>Delivery confirmed!</Text>
                <Text style={{ fontFamily: font.body, fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>This order is now marked as delivered.</Text>
              </View>
            ) : (
              <>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceDeep, alignSelf: 'center', marginBottom: 22 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryDim} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: font.h2, fontSize: 19, color: colors.ink }}>Enter delivery PIN</Text>
                    <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted }}>Ask the customer for their code</Text>
                  </View>
                </View>
                <Divider style={{ marginVertical: 18 }} />
                <TextInput
                  value={pinInput}
                  onChangeText={text => { setPinError(''); if (text.length <= 4 && /^\d*$/.test(text)) setPinInput(text); }}
                  placeholder="· · · ·"
                  placeholderTextColor={colors.inkGhost}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={{
                    backgroundColor: colors.surfaceSoft, borderRadius: 16, borderWidth: 2,
                    borderColor: pinError ? colors.error : pinInput.length === 4 ? colors.primary : colors.surfaceMuted,
                    paddingVertical: 20, fontFamily: font.bold, fontSize: 34, color: colors.ink, textAlign: 'center', letterSpacing: 16,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  }}
                />
                {pinError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={{ fontFamily: font.labelM, fontSize: 12.5, color: colors.error, flex: 1 }}>{pinError}</Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkGhost, textAlign: 'center', marginTop: 12, lineHeight: 17 }}>
                    The customer received this code when they placed the order. Enter it after they&apos;ve paid you in cash.
                  </Text>
                )}
                <View style={{ height: 20 }} />
                <Btn title="Confirm delivery" onPress={handleVerifyPin} disabled={pinInput.length < 4} fullWidth />
                <Btn title="Cancel" variant="ghost" onPress={handleCloseModal} fullWidth />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ icon, text, strong, muted, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; strong?: boolean; muted?: boolean; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, fontFamily: strong ? font.labelL : font.body, fontSize: strong ? 15 : 14, color: muted ? colors.inkMuted : colors.ink, lineHeight: 21 }}>
        {text}
      </Text>
    </View>
  );
}
