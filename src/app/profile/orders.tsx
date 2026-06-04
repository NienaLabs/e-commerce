import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { listMyOrders, Order } from '../../api/orders';
import { getLocalOrders, LocalOrder } from '../../api/localOrders';
import { AuthContext } from '../../context/AuthContext';

// Unified display type that covers both backend and local orders
interface DisplayOrder {
  id: string;
  ref: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  items: { product_id: string; name?: string; quantity: number }[];
  created_at: string;
  isLocal: boolean;
}

function toDisplayOrder(order: Order): DisplayOrder {
  return {
    id: order.id,
    ref: order.id.slice(-8).toUpperCase(),
    status: order.status,
    subtotal: order.subtotal,
    shipping_fee: order.shipping_fee,
    total_amount: order.total_amount,
    items: order.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    created_at: order.created_at,
    isLocal: false,
  };
}

function localToDisplayOrder(order: LocalOrder): DisplayOrder {
  return {
    id: order.id,
    ref: order.ref,
    status: order.status,
    subtotal: order.subtotal,
    shipping_fee: order.shipping_fee,
    total_amount: order.total_amount,
    items: order.items.map(i => ({ product_id: i.product_id, name: i.name, quantity: i.quantity })),
    created_at: order.created_at,
    isLocal: true,
  };
}

function PinModal({
  visible, code, orderId, onClose, colors,
}: {
  visible: boolean; code: string; orderId: string; onClose: () => void; colors: any;
}) {
  const digits = code.split('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, paddingBottom: 44,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignSelf: 'center', marginBottom: 24 }} />

          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="shield-checkmark" size={34} color={colors.primaryDim} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, marginBottom: 6 }}>
              Your Delivery PIN
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
              Give this code to the delivery driver when your order arrives. Do not share it before delivery.
            </Text>
          </View>

          <View style={{
            flexDirection: 'row', gap: 12, justifyContent: 'center',
            backgroundColor: colors.surfaceSoft,
            borderRadius: 20, padding: 24,
            marginBottom: 24,
            borderWidth: 2, borderColor: colors.primaryBorder,
          }}>
            {digits.map((digit, i) => (
              <View key={i} style={{
                width: 56, height: 72, borderRadius: 16,
                backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
              }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: '#222022' }}>{digit}</Text>
              </View>
            ))}
          </View>

          <View style={{
            flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            backgroundColor: colors.warningGhost, borderRadius: 14, padding: 14, marginBottom: 24,
          }}>
            <Ionicons name="information-circle" size={18} color={colors.warning} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.warning, lineHeight: 20 }}>
              For order <Text style={{ fontFamily: 'Inter_700Bold' }}>{orderId}</Text>. This PIN confirms the driver handed the package to you personally.
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primaryDim : colors.primary,
              borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            })}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>Got it, I'm ready</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getPinFromOrderId(orderId: string) {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) % 10000;
  }
  return String(hash).padStart(4, '0');
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);
  const [activePinOrderId, setActivePinOrderId] = useState<string | null>(null);

  // Fetch backend orders (may be empty / fail silently)
  const { data: backendOrders = [], isLoading: backendLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => listMyOrders(token!),
    enabled: !!token,
    retry: false,
  });

  // Fetch local orders (always available)
  const { data: localOrders = [], isLoading: localLoading } = useQuery({
    queryKey: ['local-orders'],
    queryFn: () => getLocalOrders(),
  });

  const isLoading = backendLoading || localLoading;

  // Merge: local orders first (newest), then backend orders that aren't already local
  const allOrders: DisplayOrder[] = [
    ...localOrders.map(localToDisplayOrder),
    ...backendOrders.map(toDisplayOrder),
  ];

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    pending:    { label: 'Pending',    bg: colors.surfaceSoft,  text: colors.inkMuted,   icon: 'time-outline' },
    confirmed:  { label: 'Confirmed',  bg: colors.infoGhost,    text: colors.info,       icon: 'checkmark-outline' },
    processing: { label: 'Processing', bg: colors.infoGhost,    text: colors.info,       icon: 'time-outline' },
    shipped:    { label: 'Shipped',    bg: colors.primaryGhost, text: colors.primaryDim, icon: 'car-outline' },
    delivered:  { label: 'Delivered',  bg: colors.successGhost, text: colors.success,    icon: 'checkmark-circle' },
    cancelled:  { label: 'Cancelled',  bg: colors.errorGhost,   text: colors.error,      icon: 'close-circle' },
    refunded:   { label: 'Refunded',   bg: colors.warningGhost, text: colors.warning,    icon: 'return-up-back-outline' },
  };

  const activePinOrder = allOrders.find(o => o.id === activePinOrderId) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)}
          style={{ padding: 8, marginRight: 8, marginLeft: -8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>My Orders</Text>
        {allOrders.length > 0 && (
          <View style={{ marginLeft: 8, backgroundColor: colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.primaryDim }}>{allOrders.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : allOrders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="bag-outline" size={72} color={colors.surfaceMuted} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginTop: 20 }}>No orders yet</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 8, textAlign: 'center' }}>
            When you place orders, they'll appear here.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={{ marginTop: 24, paddingHorizontal: 28, paddingVertical: 14, backgroundColor: colors.ink, borderRadius: 24 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.surface }}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
          {allOrders.map(order => {
            const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.confirmed;
            const needsPin = order.status === 'shipped';
            const pin = getPinFromOrderId(order.id);

            return (
              <View
                key={order.id}
                style={{
                  backgroundColor: colors.surface, borderRadius: 24,
                  borderWidth: 1, borderColor: needsPin ? colors.primaryBorder : colors.surfaceMuted,
                  shadowColor: needsPin ? colors.primary : '#000',
                  shadowOffset: { width: 0, height: needsPin ? 6 : 3 },
                  shadowOpacity: needsPin ? 0.1 : 0.04,
                  shadowRadius: needsPin ? 16 : 10, elevation: 3,
                  overflow: 'hidden',
                }}
              >
                {needsPin && <View style={{ height: 3, backgroundColor: colors.primary }} />}

                <View style={{ padding: 20 }}>
                  {/* Order header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>#{order.ref}</Text>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>
                        {formatDate(order.created_at)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name={cfg.icon} size={13} color={cfg.text} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{cfg.label}</Text>
                    </View>
                  </View>

                  {/* Items list */}
                  {order.items.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="cube-outline" size={14} color={colors.inkGhost} style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, flex: 1 }} numberOfLines={1}>
                        {item.name ?? `Product ${item.product_id.slice(0, 8)}`} × {item.quantity}
                      </Text>
                    </View>
                  ))}

                  {/* Totals */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, marginBottom: 14 }}>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>
                      Subtotal ${order.subtotal.toFixed(2)} · Shipping ${order.shipping_fee.toFixed(2)}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>${order.total_amount.toFixed(2)}</Text>
                  </View>

                  {/* PIN banner for shipped orders */}
                  {needsPin && (
                    <Pressable
                      onPress={() => setActivePinOrderId(order.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: colors.primaryGhost,
                        borderRadius: 14, padding: 14, marginBottom: 12,
                        borderWidth: 1, borderColor: colors.primaryBorder,
                        gap: 12, opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ionicons name="keypad" size={20} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primaryDim }}>Tap to see your Delivery PIN</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.primaryDim, marginTop: 2 }}>
                          Show this code to the driver to complete delivery
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.primaryDim} />
                    </Pressable>
                  )}

                  {/* Delivered badge */}
                  {order.status === 'delivered' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successGhost, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.success }}>Delivered & confirmed</Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => router.push(`/order-tracking/${order.id}` as any)}
                      style={({ pressed }) => ({
                        flex: 1, backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft,
                        paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                        borderWidth: 1, borderColor: colors.surfaceMuted,
                      })}
                    >
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>Track Order</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (order.status === 'delivered') {
                          router.push(`/write-review?productId=${order.items[0]?.product_id}` as any);
                        } else {
                          router.push('/profile/support' as any);
                        }
                      }}
                      style={({ pressed }) => ({
                        flex: 1, backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft,
                        paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                        borderWidth: 1, borderColor: colors.surfaceMuted,
                      })}
                    >
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>
                        {order.status === 'delivered' ? 'Leave Review' : 'Help'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {activePinOrder && (
        <PinModal
          visible={!!activePinOrder}
          code={getPinFromOrderId(activePinOrder.id)}
          orderId={`#${activePinOrder.ref}`}
          onClose={() => setActivePinOrderId(null)}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}
