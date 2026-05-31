import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const STATS = [
  { label: 'Revenue (Month)', value: '$4,820', change: '+18%', up: true, icon: 'trending-up' },
  { label: 'Orders Today', value: '24', change: '+5 vs. yesterday', up: true, icon: 'cube' },
  { label: 'Products Listed', value: '48', change: '3 pending review', up: false, icon: 'grid' },
  { label: 'Avg. Rating', value: '4.8 ★', change: '124 reviews', up: true, icon: 'star' },
];

const RECENT_ORDERS = [
  { id: 'EL-90120', customer: 'Ama Owusu', item: 'Wireless Headphones', amount: 149.99, status: 'new', deliveryCode: '4921' },
  { id: 'EL-90119', customer: 'Kweku Asante', item: 'Bluetooth Speaker', amount: 59.99, status: 'packed', deliveryCode: '7304' },
  { id: 'EL-90118', customer: 'Abena Darkwah', item: 'Smart Watch', amount: 299.00, status: 'shipped', deliveryCode: '1847' },
  { id: 'EL-90117', customer: 'Kofi Boateng', item: 'Earbuds Pro', amount: 159.00, status: 'delivered', deliveryCode: '5523' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: '#eff6ff', text: '#1d4ed8' },
  packed: { label: 'Packed', bg: '#fffbeb', text: '#b45309' },
  shipped: { label: 'Shipped', bg: '#f0fdf4', text: '#15803d' },
  delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', text: '#dc2626' },
};

const QUICK_ACTIONS = [
  { icon: 'add-circle', label: 'Add Product', path: '/vendor-dashboard/add-product' },
  { icon: 'receipt', label: 'Orders', path: '/vendor-dashboard/orders' },
  { icon: 'bar-chart', label: 'Analytics', path: '/vendor-dashboard/analytics' },
  { icon: 'wallet', label: 'Payouts', path: '/vendor-dashboard/payouts' },
];

export default function VendorDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* ─── Top Bar ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        {!isDesktop && (
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={{ marginRight: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="exit-outline" size={20} color={colors.inkSoft} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>Dashboard</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>SoundWave Audio</Text>
        </View>
        <Pressable
          onPress={() => router.push('/vendor-dashboard/add-product' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 6 }}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.primary }}>Add Product</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: isDesktop ? 32 : 100, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Stats Grid ─── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {STATS.map(stat => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                minWidth: isDesktop ? 180 : '46%',
                backgroundColor: colors.surface,
                borderRadius: 20, padding: 18,
                borderWidth: 1, borderColor: colors.surfaceMuted,
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={stat.icon as any} size={20} color="#7a8a05" />
                </View>
                <View style={{ backgroundColor: stat.up ? '#f0fdf4' : colors.surfaceSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: stat.up ? '#15803d' : colors.inkGhost }}>{stat.change}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 26 : 22, color: colors.ink, marginBottom: 2 }}>{stat.value}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Quick Actions ─── */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(action => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.path as any)}
                style={({ pressed }) => ({
                  flex: 1, minWidth: isDesktop ? 140 : '46%',
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  borderRadius: 18, paddingVertical: 18, paddingHorizontal: 12,
                  alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
                })}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={action.icon as any} size={22} color="#7a8a05" />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink, textAlign: 'center' }}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── Recent Orders ─── */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Recent Orders</Text>
            <Pressable onPress={() => router.push('/vendor-dashboard/orders' as any)}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#7a8a05' }}>See all →</Text>
            </Pressable>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
            {RECENT_ORDERS.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/vendor-dashboard/order/${order.id}` as any)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderBottomWidth: i < RECENT_ORDERS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.surfaceMuted,
                    backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
                  })}
                >
                  {/* Status dot */}
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cfg.text, marginRight: 12, flexShrink: 0 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>{order.id}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                      {order.customer} · {order.item}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>${order.amount.toFixed(2)}</Text>
                    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: cfg.text }}>{cfg.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
