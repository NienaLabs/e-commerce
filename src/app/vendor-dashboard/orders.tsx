import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorOrders } from '../../api/vendors';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function VendorOrdersScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [filter, setFilter] = useState('All');
  const { token, vendor } = useAuth();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['vendor-orders', vendor?.id],
    queryFn: () => getVendorOrders(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
    refetchInterval: 3000,
  });

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: 'Pending', bg: colors.infoGhost, text: colors.info },
    confirmed: { label: 'Confirmed', bg: colors.primaryGhost, text: colors.primaryDim },
    processing: { label: 'Processing', bg: colors.warningGhost, text: colors.warning },
    shipped: { label: 'Shipped', bg: colors.primaryGhost, text: colors.primaryDim },
    delivered: { label: 'Delivered', bg: colors.successGhost, text: colors.success },
    cancelled: { label: 'Cancelled', bg: colors.errorGhost, text: colors.error },
  };

  const filtered = filter === 'All' 
    ? orders 
    : orders.filter(o => o.status === filter.toLowerCase());

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        {!isDesktop && (
          <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
        )}
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Order Management</Text>
      </View>

      {/* Filter Tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, backgroundColor: colors.surfaceSoft }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ 
            paddingHorizontal: isDesktop ? 24 : 16, 
            paddingVertical: 16, 
            gap: 12 
          }}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={({ pressed }) => ({ 
                paddingHorizontal: 20, 
                paddingVertical: 10, 
                borderRadius: 24, 
                backgroundColor: filter === f ? colors.ink : (pressed ? colors.surfaceMuted : colors.surface), 
                borderWidth: 1, 
                borderColor: filter === f ? colors.ink : colors.surfaceMuted,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: filter === f ? 4 : 1 },
                shadowOpacity: filter === f ? (colors.isDark ? 0.3 : 0.15) : 0.05,
                shadowRadius: filter === f ? 8 : 2,
                elevation: filter === f ? 4 : 1,
              })}
            >
              <Text style={{ 
                fontFamily: filter === f ? 'Inter_700Bold' : 'Inter_600SemiBold', 
                fontSize: 14, 
                color: filter === f ? colors.surface : colors.inkSoft 
              }}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isDesktop ? 24 : 16, paddingBottom: 60, gap: 16 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.error, textAlign: 'center', marginTop: 40 }}>Failed to load orders</Text>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="cube-outline" size={48} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted }}>No orders found</Text>
          </View>
        ) : (
          filtered.map(order => {
            const cfg = STATUS_CFG[order.status] || { label: order.status, bg: colors.surfaceMuted, text: colors.ink };
            const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/vendor-dashboard/order/${order.id}` as any)}
                style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.surfaceMuted, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.2 : 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>{date}</Text>
                  </View>
                  <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>{order.customer_name}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{order.items_count} item{order.items_count > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>${order.total_amount.toFixed(2)}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
