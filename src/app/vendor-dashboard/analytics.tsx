import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { getVendorSummary, getVendorRevenue, getVendorTopProducts, getVendorOrdersBreakdown } from '../../api/analytics';
import { Header, ScreenBody, Section, Card, StatGrid, StatCard, EmptyState, Divider, font } from '../../components/vendor/kit';

const money = (n: number) => `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
const STATUS_TONE: Record<string, Tone> = {
  delivered: 'success', shipped: 'info', processing: 'warning',
  confirmed: 'primary', pending: 'neutral', cancelled: 'error', refunded: 'warning',
};

export default function VendorAnalyticsScreen() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);

  const toneToColor = (tone: Tone) => ({
    success: colors.success, info: colors.info, warning: colors.warning,
    error: colors.error, primary: colors.primaryDim, neutral: colors.inkGhost,
  }[tone]);

  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['vendor-summary'], queryFn: () => getVendorSummary(token!), enabled: !!token });
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({ queryKey: ['vendor-revenue'], queryFn: () => getVendorRevenue(token!, { granularity: 'monthly', days: 180 }), enabled: !!token });
  const { data: topProducts = [], isLoading: productsLoading } = useQuery({ queryKey: ['vendor-top-products'], queryFn: () => getVendorTopProducts(token!, 5), enabled: !!token });
  const { data: breakdown = [], isLoading: breakdownLoading } = useQuery({ queryKey: ['vendor-breakdown'], queryFn: () => getVendorOrdersBreakdown(token!), enabled: !!token });

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.revenue), 1) : 1;
  const totalProductRevenue = topProducts.reduce((s, p) => s + p.total_revenue, 0) || 1;
  const isLoading = summaryLoading || revenueLoading || productsLoading || breakdownLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      <Header title="Analytics" subtitle="How your store is trending" onBack={() => router.push('/vendor-dashboard' as any)} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontFamily: font.body, fontSize: 14, color: colors.inkMuted }}>Crunching your numbers…</Text>
        </View>
      ) : (
        <ScreenBody>
          {/* KPIs */}
          <Section title="Key numbers" caption="Your headline figures across the whole store.">
            <StatGrid>
              <StatCard icon="cash-outline" label="Total revenue" value={money(summary?.total_revenue ?? 0)} hint={`${money(summary?.revenue_this_month ?? 0)} earned this month`} hintTone="success" />
              <StatCard icon="receipt-outline" label="Total orders" value={String(summary?.total_orders ?? 0)} hint={`${summary?.orders_this_month ?? 0} placed this month`} hintTone="success" />
              <StatCard icon="star-outline" label="Average rating" value={`${(summary?.avg_rating ?? 0).toFixed(1)}★`} hint="Across all your reviews" />
              <StatCard icon="heart-outline" label="Followers" value={String(summary?.total_followers ?? 0)} hint="Shoppers following your store" />
            </StatGrid>
          </Section>

          {/* Revenue over time */}
          <Section title="Revenue over time" caption="Your paid sales, month by month. The brightest bar is the most recent.">
            <Card>
              {revenueData.length === 0 ? (
                <EmptyState icon="bar-chart-outline" title="No revenue yet" body="Once you start making sales, your monthly trend will appear here." />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 10 }}>
                  {revenueData.slice(-6).map((d, i, arr) => {
                    const barHeight = Math.max(6, (d.revenue / maxRevenue) * 118);
                    const isLast = i === arr.length - 1;
                    const label = d.period.length === 7
                      ? new Date(d.period + '-01').toLocaleDateString('en-US', { month: 'short' })
                      : new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <View key={d.period} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: font.bold, fontSize: 10, color: isLast ? colors.ink : colors.inkMuted, marginBottom: 6 }}>
                          {d.revenue >= 1000 ? `$${(d.revenue / 1000).toFixed(1)}k` : `$${d.revenue.toFixed(0)}`}
                        </Text>
                        {isLast ? (
                          <LinearGradient colors={[colors.primary, colors.primaryDim]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: '80%', height: barHeight, borderRadius: 9 }} />
                        ) : (
                          <View style={{ width: '80%', height: barHeight, borderRadius: 9, backgroundColor: colors.isDark ? 'rgba(195,216,9,0.16)' : 'rgba(195,216,9,0.22)' }} />
                        )}
                        <Text style={{ fontFamily: font.body, fontSize: 11, color: colors.inkMuted, marginTop: 6 }}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </Section>

          {/* Top products */}
          <Section title="Your best sellers" caption="The products bringing in the most revenue.">
            <Card style={{ gap: 16 }}>
              {topProducts.length === 0 ? (
                <EmptyState icon="pricetags-outline" title="No sales data yet" body="Your top-earning products will be ranked here once orders come in." />
              ) : (
                topProducts.map((p, i) => {
                  const pctVal = Math.round((p.total_revenue / totalProductRevenue) * 100);
                  return (
                    <View key={p.product_id} style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 13.5, color: colors.ink }} numberOfLines={1}>{i + 1}. {p.product_name}</Text>
                        <Text style={{ fontFamily: font.bold, fontSize: 13.5, color: colors.ink }}>{money(p.total_revenue)}</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34,32,34,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <LinearGradient colors={[colors.primaryDim, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(4, pctVal)}%`, height: '100%', borderRadius: 4 }} />
                      </View>
                      <Text style={{ fontFamily: font.body, fontSize: 11.5, color: colors.inkMuted }}>{p.units_sold} sold · {p.avg_rating.toFixed(1)}★ · {pctVal}% of top-5 revenue</Text>
                    </View>
                  );
                })
              )}
            </Card>
          </Section>

          {/* Order breakdown */}
          <Section title="Orders by status" caption="Where your orders currently sit.">
            <Card>
              {breakdown.length === 0 ? (
                <EmptyState icon="albums-outline" title="No orders yet" body="A breakdown of your orders will appear here." />
              ) : (
                breakdown.map((item, i) => {
                  const tone = STATUS_TONE[item.status] ?? 'neutral';
                  return (
                    <View key={item.status}>
                      {i > 0 && <Divider style={{ marginVertical: 12 }} />}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: toneToColor(tone) }} />
                        <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 14, color: colors.ink, textTransform: 'capitalize' }}>{item.status}</Text>
                        <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted }}>{money(item.total_value)}</Text>
                        <Text style={{ fontFamily: font.bold, fontSize: 14, color: colors.ink, minWidth: 28, textAlign: 'right' }}>{item.count}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
          </Section>
        </ScreenBody>
      )}
    </SafeAreaView>
  );
}
