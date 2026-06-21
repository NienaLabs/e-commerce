import React, { useContext } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { 
  getVendorMe, 
  getVendorDashboardOverview, 
  getVendorDashboardAlerts, 
  getVendorDashboardBenchmark 
} from '../../api/vendors';
import { AuthContext } from '../../context/AuthContext';
import { PerformanceCards, AlertsFeed, BenchmarkPanel } from '../../components/VendorDashboard';

const QUICK_ACTIONS = [
  { icon: 'add-circle', label: 'Add Product', path: '/vendor-dashboard/add-product' },
  { icon: 'grid', label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'search-outline', label: 'Search Gaps', path: '/vendor-dashboard/search-gaps' },
  { icon: 'settings', label: 'Store Settings', path: '/vendor-dashboard/store-settings' },
];

export default function VendorDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useContext(AuthContext);

  const { data: vendor, isLoading: vendorLoading, isError } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => getVendorMe(token!),
    enabled: !!token,
    retry: false,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['vendor-overview', vendor?.id],
    queryFn: () => getVendorDashboardOverview(token!, vendor!.id, '7d'),
    enabled: !!token && !!vendor?.id,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['vendor-alerts', vendor?.id],
    queryFn: () => getVendorDashboardAlerts(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
  });

  const { data: benchmark, isLoading: benchmarkLoading } = useQuery({
    queryKey: ['vendor-benchmark', vendor?.id],
    queryFn: () => getVendorDashboardBenchmark(token!, vendor!.id, 'electronics'), // Use default category or vendor's primary category
    enabled: !!token && !!vendor?.id,
  });

  if (vendorLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !vendor) {
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
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>Insights Dashboard</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>{vendor.store_name}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: isDesktop ? 32 : 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <PerformanceCards data={overview} loading={overviewLoading} />
        
        <AlertsFeed alerts={alerts} loading={alertsLoading} />
        
        <BenchmarkPanel data={benchmark} loading={benchmarkLoading} />

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
                  <Ionicons name={action.icon as any} size={22} color={colors.primaryDim} />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink, textAlign: 'center' }}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
