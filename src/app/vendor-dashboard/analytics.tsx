import React, { useContext } from 'react';
import {
  View, Text, ScrollView, Pressable, Platform,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import {
  getVendorSummary,
  getVendorRevenue,
  getVendorTopProducts,
  getVendorOrdersBreakdown,
} from '../../api/analytics';

const BAR_COLORS = ['#c3d809', '#a8bf08', '#8da007', '#728006', '#4d5a02'];

const STATUS_COLOR: Record<string, string> = {
  delivered: '#22c55e',
  shipped: '#3b82f6',
  processing: '#f59e0b',
  confirmed: '#8b5cf6',
  pending: '#94a3b8',
  cancelled: '#dc2626',
  refunded: '#f97316',
};

export default function VendorAnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useContext(AuthContext);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['vendor-summary'],
    queryFn: () => getVendorSummary(token!),
    enabled: !!token,
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => getVendorRevenue(token!, { granularity: 'monthly', days: 180 }),
    enabled: !!token,
  });

  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-top-products'],
    queryFn: () => getVendorTopProducts(token!, 5),
    enabled: !!token,
  });

  const { data: breakdown = [], isLoading: breakdownLoading } = useQuery({
    queryKey: ['vendor-breakdown'],
    queryFn: () => getVendorOrdersBreakdown(token!),
    enabled: !!token,
  });

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.revenue), 1) : 1;
  const totalProductRevenue = topProducts.reduce((s, p) => s + p.total_revenue, 0) || 1;

  const isLoading = summaryLoading || revenueLoading || productsLoading || breakdownLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        {!isDesktop && (
          <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
        )}
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Analytics</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>
            Loading your analytics...
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }}>

          {/* ── KPI Summary Cards ── */}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ flex: 1, backgroundColor: colors.ink, borderRadius: 20, padding: 18 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#ffffff70', marginBottom: 4 }}>Total Revenue</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.primary }}>
                ${(summary?.total_revenue ?? 0).toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                ${(summary?.revenue_this_month ?? 0).toFixed(2)} this month
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkGhost, marginBottom: 4 }}>Total Orders</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink }}>
                {summary?.total_orders ?? 0}
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                {summary?.orders_this_month ?? 0} this month
              </Text>
            </View>
          </View>

          {/* ── KPI Row 2 ── */}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {[
              { label: 'Avg Rating', value: (summary?.avg_rating ?? 0).toFixed(1) + ' ★', icon: 'star' },
              { label: 'Pending Orders', value: String(summary?.pending_orders ?? 0), icon: 'time' },
              { label: 'Followers', value: String(summary?.total_followers ?? 0), icon: 'people' },
            ].map(stat => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.surfaceMuted, alignItems: 'center' }}>
                <Ionicons name={stat.icon as any} size={20} color={colors.primaryDim} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>{stat.value}</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, textAlign: 'center', marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Monthly Revenue Bar Chart ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 20 }}>Revenue Over Time</Text>
            {revenueData.length === 0 ? (
              <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', paddingVertical: 20 }}>No revenue data yet</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 }}>
                {revenueData.slice(-6).map((d, i, arr) => {
                  const barHeight = Math.max(6, (d.revenue / maxRevenue) * 120);
                  const isLast = i === arr.length - 1;
                  const label = d.period.length === 7
                    ? new Date(d.period + '-01').toLocaleDateString('en-US', { month: 'short' })
                    : new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <View key={d.period} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: isLast ? colors.primaryDim : colors.inkGhost, marginBottom: 4 }}>
                        ${d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue.toFixed(0)}
                      </Text>
                      <View style={{ width: '100%', height: barHeight, backgroundColor: isLast ? colors.primary : colors.surfaceSoft, borderRadius: 8, borderWidth: isLast ? 0 : 1, borderColor: colors.surfaceMuted }} />
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 6 }}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Top Products by Revenue ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 16 }}>Top Products by Revenue</Text>
            {topProducts.length === 0 ? (
              <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', paddingVertical: 20 }}>No sales data yet</Text>
            ) : (
              <View style={{ gap: 14 }}>
                {topProducts.map((p, i) => {
                  const pct = Math.round((p.total_revenue / totalProductRevenue) * 100);
                  return (
                    <View key={p.product_id}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink, flex: 1, marginRight: 8 }} numberOfLines={1}>
                          {p.product_name}
                        </Text>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink }}>
                          ${p.total_revenue.toFixed(2)} ({pct}%)
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: colors.surfaceSoft, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4 }} />
                      </View>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 4 }}>
                        {p.units_sold} units sold · {p.avg_rating.toFixed(1)} ★
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Order Status Breakdown ── */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 16 }}>Order Breakdown</Text>
            {breakdown.length === 0 ? (
              <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', paddingVertical: 20 }}>No orders yet</Text>
            ) : (
              breakdown.map(item => (
                <View key={item.status} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: STATUS_COLOR[item.status] ?? colors.inkMuted, marginRight: 12 }} />
                  <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, textTransform: 'capitalize' }}>
                    {item.status}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted, marginRight: 16 }}>
                    ${item.total_value.toFixed(2)}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>
                    {item.count}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
