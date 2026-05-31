import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';

// Each order gets a 4-digit delivery code generated at payment time
const MOCK_ORDERS = [
  {
    id: 'ORD-3001', date: 'May 31, 2026', total: 149.99, status: 'out_for_delivery',
    items: 1, deliveryCode: '4921', vendor: 'SoundWave Audio',
    estimatedDelivery: 'Today, 2–5 PM',
  },
  {
    id: 'ORD-2918', date: 'May 24, 2026', total: 320.50, status: 'shipped',
    items: 2, deliveryCode: '7304', vendor: 'Urban Threads',
    estimatedDelivery: 'Jun 2, 2026',
  },
  {
    id: 'ORD-2844', date: 'May 10, 2026', total: 89.99, status: 'delivered',
    items: 1, deliveryCode: '1847', vendor: 'Casa & Co.',
    estimatedDelivery: 'Delivered May 12',
  },
  {
    id: 'ORD-2720', date: 'Apr 28, 2026', total: 59.00, status: 'processing',
    items: 1, deliveryCode: '5523', vendor: 'SoundWave Audio',
    estimatedDelivery: 'Estimated Jun 5',
  },
];


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
          {/* Handle bar */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignSelf: 'center', marginBottom: 24 }} />

          {/* Title */}
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

          {/* PIN Digits */}
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

          {/* Info note */}
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

export default function OrdersScreen() {
  const { colors } = useTheme();
  const [activePinOrder, setActivePinOrder] = useState<typeof MOCK_ORDERS[0] | null>(null);

  const showPin = (order: typeof MOCK_ORDERS[0]) => setActivePinOrder(order);
  const closePin = () => setActivePinOrder(null);

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    processing:       { label: 'Processing',       bg: colors.infoGhost, text: colors.info, icon: 'time-outline' },
    packed:           { label: 'Packed',           bg: colors.warningGhost, text: colors.warning, icon: 'cube-outline' },
    shipped:          { label: 'Shipped',          bg: colors.primaryGhost, text: colors.primaryDim, icon: 'car-outline' },
    out_for_delivery: { label: 'Out for Delivery', bg: colors.primaryGhost, text: colors.primaryDim, icon: 'bicycle-outline' },
    delivered:        { label: 'Delivered',        bg: colors.successGhost, text: colors.success, icon: 'checkmark-circle' },
    cancelled:        { label: 'Cancelled',        bg: colors.errorGhost, text: colors.error, icon: 'close-circle' },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />

      {/* Header */}
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
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        {MOCK_ORDERS.map(order => {
          const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.processing;
          const needsPin = order.status === 'out_for_delivery' || order.status === 'shipped';

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
              {/* Top accent for active deliveries */}
              {needsPin && (
                <View style={{ height: 3, backgroundColor: colors.primary }} />
              )}

              <View style={{ padding: 20 }}>
                {/* Row 1: Order ID + Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{order.id}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>{order.date} · {order.vendor}</Text>
                  </View>
                  <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.text} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Row 2: Items + Total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>
                    {order.items} item{order.items > 1 ? 's' : ''} · {order.estimatedDelivery}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>${order.total.toFixed(2)}</Text>
                </View>

                {/* Delivery PIN Banner */}
                {needsPin && (
                  <Pressable
                    onPress={() => showPin(order)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: pressed ? colors.primaryGhost : colors.primaryGhost,
                      borderRadius: 14, padding: 14, marginBottom: 12,
                      borderWidth: 1, borderColor: colors.primaryBorder,
                      gap: 12,
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

                {/* Delivered confirmation */}
                {order.status === 'delivered' && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: colors.successGhost, borderRadius: 12, padding: 12, marginBottom: 12,
                  }}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.success }}>Delivered & confirmed via PIN</Text>
                  </View>
                )}

                {/* Actions row */}
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
                    onPress={() => {}}
                    style={({ pressed }) => ({
                      flex: 1, backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft,
                      paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                      borderWidth: 1, borderColor: colors.surfaceMuted,
                    })}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>
                      {order.status === 'delivered' ? 'Reorder' : 'Help'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Delivery PIN Modal */}
      {activePinOrder && (
        <PinModal
          visible={!!activePinOrder}
          code={activePinOrder.deliveryCode}
          orderId={activePinOrder.id}
          onClose={closePin}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}
