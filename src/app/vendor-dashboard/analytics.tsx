import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 1200, orders: 34 },
  { month: 'Feb', revenue: 1800, orders: 48 },
  { month: 'Mar', revenue: 2400, orders: 62 },
  { month: 'Apr', revenue: 2100, orders: 55 },
  { month: 'May', revenue: 4820, orders: 124 },
];

const TOP_PRODUCTS = [
  { name: 'Wireless Headphones', revenue: 1800, units: 12, pct: 37 },
  { name: 'Bluetooth Speaker', revenue: 1200, units: 20, pct: 25 },
  { name: 'Smart Watch', revenue: 900, units: 3, pct: 19 },
  { name: 'Earbuds Pro', revenue: 700, units: 4, pct: 14 },
  { name: 'Others', revenue: 220, units: 7, pct: 5 },
];

const BAR_COLORS = ['#c3d809', '#a8bf08', '#8da007', '#728006', '#4d5a02'];

const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue));

export default function VendorAnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Analytics</Text>
        <View style={{ backgroundColor: colors.surfaceSoft, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>Last 5 months</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>

        {/* Top Stats */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1, backgroundColor: colors.ink, borderRadius: 20, padding: 18 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#ffffff70', marginBottom: 4 }}>Total Revenue</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.primary }}>$12,320</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e', marginTop: 4 }}>↑ +18% vs. last period</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkGhost, marginBottom: 4 }}>Total Orders</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink }}>323</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e', marginTop: 4 }}>↑ +12 new this week</Text>
          </View>
        </View>

        {/* Revenue Bar Chart */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 20 }}>Monthly Revenue</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 }}>
            {MONTHLY_DATA.map((d, i) => {
              const barHeight = (d.revenue / maxRevenue) * 120;
              const isLast = i === MONTHLY_DATA.length - 1;
              return (
                <View key={d.month} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: isLast ? colors.primaryDim : colors.inkGhost, marginBottom: 4 }}>
                    ${(d.revenue / 1000).toFixed(1)}k
                  </Text>
                  <View style={{ width: '100%', height: barHeight, backgroundColor: isLast ? colors.primary : colors.surfaceSoft, borderRadius: 8, borderWidth: isLast ? 0 : 1, borderColor: colors.surfaceMuted }} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 6 }}>{d.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Products */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 16 }}>Top Products by Revenue</Text>
          <View style={{ gap: 14 }}>
            {TOP_PRODUCTS.map((p, i) => (
              <View key={p.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>{p.name}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink }}>${p.revenue} ({p.pct}%)</Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.surfaceSoft, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${p.pct}%`, height: '100%', backgroundColor: BAR_COLORS[i] ?? colors.primary, borderRadius: 4 }} />
                </View>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 4 }}>{p.units} units sold</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Breakdown */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 16 }}>Order Breakdown</Text>
          {[
            { label: 'Delivered', count: 284, color: '#22c55e' },
            { label: 'In Progress', count: 28, color: '#f59e0b' },
            { label: 'Cancelled', count: 11, color: '#dc2626' },
          ].map(item => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 12 }} />
              <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>{item.label}</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
