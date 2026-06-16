import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorOrders } from '../../api/vendors';
import { getVendorSummary } from '../../api/analytics';
import { useAuth } from '../../context/AuthContext';

const QUICK_ACTIONS = [
  { icon: 'add-circle', label: 'Add Product', path: '/vendor-dashboard/add-product' },
  { icon: 'grid', label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'settings', label: 'Store Settings', path: '/vendor-dashboard/store-settings' },
];

export default function VendorDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token, vendor, isLoading: authLoading } = useAuth();

  const { data: summary, isLoading: analyticsLoading } = useQuery({
    queryKey: ['vendor-summary'],
    queryFn: () => getVendorSummary(token!),
    enabled: !!token && !!vendor?.id,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['vendor-orders', vendor?.id],
    queryFn: () => getVendorOrders(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
    select: (orders) => orders.slice(0, 5),
  });

  if (authLoading || (analyticsLoading && !!vendor)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // If no vendor profile exists, prompt them to become a vendor
  if (!vendor) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <Ionicons name="storefront-outline" size={64} color={colors.inkGhost} />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginTop: 16 }}>No Vendor Profile</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 8, textAlign: 'center', marginHorizontal: 32 }}>
          You need to register as a vendor before you can access the dashboard.
        </Text>
        <Pressable
          onPress={() => router.push('/become-vendor' as any)}
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ink, borderRadius: 24 }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', color: colors.surface }}>Become a Vendor</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const STATS = [
    { label: 'Total Revenue', value: `$${(summary?.total_revenue || 0).toFixed(2)}`, change: `$${(summary?.revenue_this_month || 0).toFixed(2)} this month`, up: true, icon: 'wallet' },
    { label: 'Active Orders', value: String(summary?.pending_orders || 0), change: 'Needs fulfillment', up: true, icon: 'cube' },
    { label: 'Products', value: String(summary?.total_products || vendor.products), change: 'Active in store', up: true, icon: 'grid' },
    { label: 'Followers', value: String(summary?.total_followers || vendor.followers), change: 'Total followers', up: true, icon: 'people' },
  ];

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
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>{vendor.store_name}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/vendor-dashboard/add-product' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 6 }}
        >
          <Ionicons name="add" size={18} color={colors.surface} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.surface }}>Add Product</Text>
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
                  <Ionicons name={stat.icon as any} size={20} color={colors.primaryDim} />
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
                  flex: 1, minWidth: isDesktop ? 140 : '30%',
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  borderRadius: 18, paddingVertical: 18, paddingHorizontal: 12,
                  alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
                })}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={action.icon as any} size={22} color={colors.primaryDim} />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink, textAlign: 'center' }}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Recent Orders</Text>
            <Pressable onPress={() => router.push('/vendor-dashboard/orders' as any)}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primaryDim }}>View All</Text>
            </Pressable>
          </View>
          
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, padding: 16, gap: 16 }}>
            {analyticsLoading ? (
              <ActivityIndicator size="small" color={colors.primaryDim} style={{ marginVertical: 20 }} />
            ) : recentOrders.length === 0 ? (
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', paddingVertical: 20 }}>No recent orders.</Text>
            ) : (
              recentOrders.map((order, i) => (
                <View key={order.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.surfaceMuted, paddingTop: i === 0 ? 0 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cube-outline" size={20} color={colors.ink} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>{order.customer_name}</Text>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                        {new Date(order.created_at).toLocaleDateString()} • {order.items_count} item{order.items_count > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>${order.total_amount.toFixed(2)}</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: order.status === 'delivered' ? colors.success : colors.warning, marginTop: 2, textTransform: 'capitalize' }}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
