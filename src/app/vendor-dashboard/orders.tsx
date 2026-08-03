import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVendorOrders } from '../../api/vendors';
import { useAuth } from '../../context/AuthContext';
import { useWsEvent } from '../../context/WebSocketContext';
import { Header, ScreenBody, Card, Badge, Chip, EmptyState, Divider, Skeleton, font } from '../../components/vendor/kit';

const FILTERS = ['All', 'New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
const FILTER_TO_STATUS: Record<string, string> = {
  'New': 'pending', 'Confirmed': 'confirmed', 'Processing': 'processing',
  'Shipped': 'shipped', 'Delivered': 'delivered', 'Cancelled': 'cancelled', 'Refunded': 'refunded',
};

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
const STATUS_META: Record<string, { label: string; tone: Tone; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'New', tone: 'info', icon: 'sparkles-outline' },
  confirmed: { label: 'Confirmed', tone: 'primary', icon: 'checkmark-circle-outline' },
  processing: { label: 'Processing', tone: 'warning', icon: 'construct-outline' },
  shipped: { label: 'Shipped', tone: 'info', icon: 'car-outline' },
  delivered: { label: 'Delivered', tone: 'success', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', tone: 'error', icon: 'close-circle-outline' },
  refunded: { label: 'Refunded', tone: 'warning', icon: 'return-up-back-outline' },
};

export default function VendorOrdersScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('All');
  const { token, vendor } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['vendor-orders', vendor?.id],
    queryFn: () => getVendorOrders(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
    staleTime: 10_000,
  });

  useWsEvent('new_order', () => queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendor?.id] }));
  useWsEvent('order_status_changed', () => queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendor?.id] }));

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === FILTER_TO_STATUS[filter]);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header
        title="Orders"
        subtitle={pendingCount > 0 ? `${pendingCount} new order${pendingCount === 1 ? '' : 's'} to fulfil` : `${orders.length} order${orders.length === 1 ? '' : 's'} total`}
        onBack={() => router.push('/vendor-dashboard' as any)}
      />

      {/* Filter chips */}
      <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderBottomWidth: 1, borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 8 }}>
          {FILTERS.map(f => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <ScreenBody>
        {isLoading ? (
          [0, 1, 2].map(i => (
            <Card key={i} style={{ gap: 12 }}>
              <Skeleton width="45%" height={14} />
              <Divider />
              <Skeleton width="70%" height={14} />
            </Card>
          ))
        ) : error ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState
              icon="alert-circle-outline"
              tone="error"
              title="Couldn't load orders"
              body={(error as any)?.message ?? 'Something went wrong. Please try again.'}
              cta={{ label: 'Retry', onPress: () => queryClient.invalidateQueries({ queryKey: ['vendor-orders'] }), icon: 'refresh' }}
            />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState
              icon="receipt-outline"
              title={filter === 'All' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
              body={filter === 'All' ? 'When customers place orders, they’ll appear here for you to confirm, pack and deliver.' : 'Try a different filter to see other orders.'}
            />
          </View>
        ) : (
          filtered.map(order => {
            const meta = STATUS_META[order.status] ?? { label: order.status, tone: 'neutral' as Tone, icon: 'ellipse-outline' as const };
            const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <Card key={order.id} onPress={() => router.push(`/vendor-dashboard/order/${order.id}` as any)} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.ink }}>#{order.id.slice(-8).toUpperCase()}</Text>
                    <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{date}</Text>
                  </View>
                  <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ fontFamily: font.labelL, fontSize: 14, color: colors.ink }} numberOfLines={1}>{order.customer_name}</Text>
                    <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                      {order.items_count} item{order.items_count > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.ink }}>GH₵{order.total_amount.toFixed(2)}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScreenBody>
    </View>
  );
}
