import React, { useContext } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorMe, getVendorDashboardOverview, getVendorDashboardAlerts, getVendorDashboardBenchmark, getVendorOrders } from '../../api/vendors';
import { getVendorSummary, getVendorRevenue } from '../../api/analytics';
import { AuthContext } from '../../context/AuthContext';
import { Header, Section, Card, ScreenBody, EmptyState, Badge, Skeleton, useResponsive, font, glass } from '../../components/vendor/kit';
import { useVendorDrawer } from '../../context/VendorDrawerContext';

const money = (n: number) => `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${(n ?? 0).toFixed(0)}`);

export default function VendorDashboard() {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const { token, user, isLoading: authLoading } = useContext(AuthContext);
  const sidebar = useVendorDrawer();

  const { data: vendor, isLoading: vendorLoading, isError } = useQuery({ queryKey: ['vendor-me'], queryFn: () => getVendorMe(token!), enabled: !!token, retry: false });
  const { data: summary, isLoading: analyticsLoading } = useQuery({ queryKey: ['vendor-summary'], queryFn: () => getVendorSummary(token!), enabled: !!token });
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({ queryKey: ['vendor-alerts', vendor?.id], queryFn: () => getVendorDashboardAlerts(token!, vendor!.id), enabled: !!token && !!vendor?.id });
  const { data: revenueData = [] } = useQuery({ queryKey: ['vendor-revenue'], queryFn: () => getVendorRevenue(token!, { granularity: 'monthly', days: 240 }), enabled: !!token });
  const { data: orders = [] } = useQuery({ queryKey: ['vendor-orders', vendor?.id], queryFn: () => getVendorOrders(token!, vendor!.id), enabled: !!token && !!vendor?.id });
  const { data: overview } = useQuery({ queryKey: ['vendor-overview', vendor?.id], queryFn: () => getVendorDashboardOverview(token!, vendor!.id), enabled: !!token && !!vendor?.id });

  if (authLoading || (analyticsLoading && !!vendor) || (vendorLoading && !isError)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6', justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !vendor) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon="storefront-outline" title="No vendor profile yet" body="You need to register as a vendor before you can open the dashboard." cta={{ label: 'Become a vendor', onPress: () => router.push('/become-vendor' as any), icon: 'arrow-forward' }} />
        </View>
      </SafeAreaView>
    );
  }

  const followers = summary?.total_followers ?? vendor.followers ?? 0;
  const revThisMonth = summary?.revenue_this_month ?? 0;
  const revTotal = summary?.total_revenue ?? 0;
  // Units actually sold comes from the dashboard overview endpoint.
  const productsSold = overview?.total_units ?? 0;
  const recentOrders = [...orders].slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      {/* Custom Header for Redesign — menu on the LEFT */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 20 }}>
        {!isDesktop && (
          <Pressable
            onPress={() => sidebar.toggle()} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Open menu"
            style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="menu-outline" size={24} color={colors.ink} />
          </Pressable>
        )}
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink }}>Vendor Dashboard</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24 }}>
          {/* Main Content Area */}
          <View style={{ flex: 3, gap: 24 }}>
            {/* Top Cards (Green themed, detailed descriptions) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <TopStatCard title="CUSTOMERS" value={followers.toLocaleString()} desc="Total number of customers following your store" icon="people" />
              <TopStatCard title="INCOME" value={money(revTotal)} desc="Your total income generated from sales" icon="wallet" />
              <TopStatCard title="PRODUCTS SOLD" value={productsSold.toLocaleString()} desc="Total number of products sold to date" icon="cube" />
            </View>

            {/* Real Data Revenue Overview (replacing mock marketplace) */}
            <RevenuePanel revenueData={revenueData} thisMonth={revThisMonth} total={revTotal} loading={false} />

            {/* Recent Orders */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Recent Orders</Text>
              <Pressable onPress={() => router.push('/vendor-dashboard/orders' as any)}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#28b463', letterSpacing: 0.5 }}>SEE ALL</Text>
              </Pressable>
            </View>
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              {recentOrders.length === 0 ? (
                <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted }}>No recent orders.</Text>
              ) : (
                recentOrders.map((o, i) => {
                  const statusColor = o.status === 'delivered' ? '#28b463' : o.status === 'cancelled' ? '#ff4d4d' : colors.inkMuted;
                  const statusLabel = o.status.charAt(0).toUpperCase() + o.status.slice(1);
                  return (
                    <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: i === recentOrders.length - 1 ? 0 : 1, borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, width: isDesktop ? 80 : 60 }}>#{o.id.slice(-6).toUpperCase()}</Text>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.ink, flex: 2 }} numberOfLines={1}>{o.customer_name}</Text>
                      {isDesktop && (
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, flex: 1.5 }}>
                          {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      )}
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink, width: 60 }}>${o.total_amount.toFixed(2)}</Text>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: statusColor, width: 70, textAlign: 'right' }}>{statusLabel}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Right Rail: Summary */}
          <View style={{ flex: 1, minWidth: 280, gap: 24 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Summary</Text>

            {/* Your Balance */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6, position: 'relative', overflow: 'hidden' }}>
              <Image 
                source={require('../../../assets/3d icons/piggy-bank.png')} 
                style={{ 
                  position: 'absolute', 
                  right: -20, 
                  bottom: -20, 
                  width: 140, 
                  height: 140, 
                  resizeMode: 'contain', 
                  transform: [{ rotate: '-10deg' }],
                  opacity: 0.9,
                }} 
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 14, color: colors.inkMuted, textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>Your Balance</Text>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.inkMuted} style={{ textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.ink, letterSpacing: -0.5, textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>{money(revTotal)}</Text>
                <Pressable onPress={() => router.push('/vendor-dashboard/payouts' as any)} style={({ pressed }) => ({ width: 32, height: 32, borderRadius: 16, backgroundColor: pressed ? '#1e8449' : '#28b463', alignItems: 'center', justifyContent: 'center', shadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, shadowOpacity: 1, elevation: 5 })}>
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 8, marginBottom: 16, textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>Current balance ready for payout</Text>
              
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="caret-up" size={12} color="#28b463" style={{ textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#28b463', textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>+$3,250.07</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="caret-down" size={12} color="#ff4d4d" style={{ textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#ff4d4d', textShadowColor: colors.isDark ? '#2a2a2a' : '#ffffff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>-$1,062.90</Text>
                </View>
              </View>
            </View>

            {/* Recent Activity / Alerts */}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginTop: 8 }}>Recent Activity</Text>
            <View style={{ gap: 16 }}>
              {alerts.slice(0, 3).map((alert, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#28b463', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={alert.type === 'payout' ? 'wallet' : 'receipt'} size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }} numberOfLines={1}>{alert.title}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
              {alerts.length === 0 && (
                 <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>No recent activity.</Text>
              )}
            </View>

            {/* Top Categories */}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginTop: 8 }}>Top Categories</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, lineHeight: 18 }}>
              Explore your top categories and keep providing top products.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <View style={{ flex: 1, backgroundColor: colors.isDark ? '#3a3a1a' : '#fff9c4', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <Ionicons name="footsteps" size={24} color="#ffb300" style={{ marginBottom: 12 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>Footwear</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a3a1a' : '#e8f5e9', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <Ionicons name="bag-add" size={24} color="#28b463" style={{ marginBottom: 12 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>Accessories</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable TopStatCard Component (Green Theme) ────────────────────────────
function TopStatCard({ title, value, desc, icon }: { title: string; value: string; desc: string; icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 140, height: 110, borderRadius: 20, overflow: 'hidden' }}>
      <LinearGradient colors={['#28b463', '#1e8449']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 16, paddingRight: 50 }}>
        {/* Tilted Watermark Icon */}
        <Ionicons name={icon} size={70} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: -15, bottom: -15, transform: [{ rotate: '-15deg' }] }} />
        
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff', letterSpacing: 0.5, marginBottom: 4, opacity: 0.9 }}>{title}</Text>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#fff', marginBottom: 6 }}>{value}</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 10, color: '#fff', opacity: 0.8, lineHeight: 14, paddingRight: 20 }}>{desc}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Real Revenue Panel Component ────────────────────────────────────────────
function RevenuePanel({ revenueData, thisMonth, total, loading }: { revenueData: { period: string; revenue: number }[]; thisMonth: number; total: number; loading: boolean }) {
  const { colors } = useTheme();
  const data = revenueData.slice(-8);
  const max = data.length ? Math.max(...data.map(d => d.revenue), 1) : 1;
  const peakIdx = data.reduce((best, d, i, arr) => (d.revenue > arr[best].revenue ? i : best), 0);

  return (
    <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Finance Flow</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>Paid sales across recent months</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 24, marginTop: 16, marginBottom: 16 }}>
        <View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.inkMuted }}>This month</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.5 }}>{money(thisMonth)}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.inkMuted }}>All-time</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.inkSoft, letterSpacing: -0.5 }}>{money(total)}</Text>
        </View>
      </View>

      {loading ? (
        <Skeleton width="100%" height={160} radius={14} />
      ) : data.length === 0 ? (
        <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>No revenue data yet.</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8, marginTop: 4 }}>
          {data.map((d, i) => {
            const h = Math.max(8, (d.revenue / max) * 110);
            const isPeak = i === peakIdx;
            const label = d.period.length === 7
              ? new Date(d.period + '-01').toLocaleDateString('en-US', { month: 'short' })
              : new Date(d.period).toLocaleDateString('en-US', { month: 'short' });
            return (
              <View key={d.period} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9.5, color: isPeak ? colors.ink : colors.inkMuted, marginBottom: 5 }}>{compact(d.revenue)}</Text>
                {isPeak ? (
                  <LinearGradient colors={['#28b463', '#1e8449']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: '60%', height: h, borderRadius: 6 }} />
                ) : (
                  <View style={{ width: '60%', height: h, borderRadius: 6, backgroundColor: colors.isDark ? 'rgba(40,180,99,0.15)' : 'rgba(40,180,99,0.2)' }} />
                )}
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 10, color: colors.inkMuted, marginTop: 6 }}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
