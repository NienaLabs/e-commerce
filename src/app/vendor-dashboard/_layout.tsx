import React from 'react';
import { View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { icon: 'grid-outline' as const, activeIcon: 'grid' as const, label: 'Dashboard', path: '/vendor-dashboard' },
  { icon: 'cube-outline' as const, activeIcon: 'cube' as const, label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'receipt-outline' as const, activeIcon: 'receipt' as const, label: 'Orders', path: '/vendor-dashboard/orders' },
  { icon: 'bar-chart-outline' as const, activeIcon: 'bar-chart' as const, label: 'Analytics', path: '/vendor-dashboard/analytics' },
  { icon: 'settings-outline' as const, activeIcon: 'settings' as const, label: 'Settings', path: '/vendor-dashboard/store-settings' },
];

const SIDE_NAV_ITEMS = [
  { icon: 'grid-outline' as const, activeIcon: 'grid' as const, label: 'Dashboard', path: '/vendor-dashboard' },
  { icon: 'cube-outline' as const, activeIcon: 'cube' as const, label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'receipt-outline' as const, activeIcon: 'receipt' as const, label: 'Orders', path: '/vendor-dashboard/orders' },
  { icon: 'bar-chart-outline' as const, activeIcon: 'bar-chart' as const, label: 'Analytics', path: '/vendor-dashboard/analytics' },
  { icon: 'wallet-outline' as const, activeIcon: 'wallet' as const, label: 'Payouts', path: '/vendor-dashboard/payouts' },
  { icon: 'settings-outline' as const, activeIcon: 'settings' as const, label: 'Store Settings', path: '/vendor-dashboard/store-settings' },
];

export default function VendorDashboardLayout() {
  const { colors } = useTheme();
  const { vendor } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/vendor-dashboard') return pathname === '/vendor-dashboard';
    return pathname.startsWith(path);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft, flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* ─── Desktop Side Nav ─── */}
      {isDesktop && (
        <View style={{
          width: 236,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.surfaceMuted,
          paddingTop: 24,
          paddingBottom: 20,
        }}>
          {/* Store header */}
          <Pressable
            onPress={() => router.push('/vendor/v1' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="storefront" size={22} color={colors.primaryDim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }} numberOfLines={1}>{vendor?.store_name ?? 'My Store'}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>Vendor Dashboard</Text>
            </View>
          </Pressable>

          {/* Nav links */}
          <View style={{ flex: 1, paddingHorizontal: 12, gap: 2 }}>
            {SIDE_NAV_ITEMS.map(item => {
              const active = isActive(item.path);
              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: active ? colors.primaryGhost : pressed ? colors.surfaceSoft : 'transparent',
                  })}
                >
                  <Ionicons name={active ? item.activeIcon : item.icon} size={20} color={active ? colors.primaryDim : colors.inkSoft} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: active ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: 14, color: active ? colors.ink : colors.inkSoft }}>
                    {item.label}
                  </Text>
                  {active && <View style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 4, backgroundColor: colors.primary }} />}
                </Pressable>
              );
            })}
          </View>

          {/* Bottom links */}
          <View style={{ paddingHorizontal: 12, gap: 2, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, paddingTop: 12 }}>
            <Pressable
              onPress={() => router.push('/vendor-dashboard/payouts' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
            >
              <Ionicons name="wallet-outline" size={18} color={colors.inkSoft} style={{ marginRight: 10 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>Payouts</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(tabs)' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
            >
              <Ionicons name="exit-outline" size={18} color={colors.inkGhost} style={{ marginRight: 10 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkGhost }}>Back to Store</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ─── Main Content ─── */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {/* ─── Mobile Bottom Nav ─── */}
      {!isDesktop && (
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.isDark ? 'rgba(34,32,34,0.92)' : 'rgba(255,255,255,0.95)',
          borderTopWidth: 1,
          borderTopColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          paddingBottom: 8,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
        }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 }}
              >
                <View style={active ? {
                  backgroundColor: colors.primaryGhost,
                  borderRadius: 12,
                  padding: 6,
                } : { padding: 6 }}>
                  <Ionicons name={active ? item.activeIcon : item.icon} size={22} color={active ? colors.primaryDim : colors.inkGhost} />
                </View>
                <Text style={{
                  fontFamily: active ? 'Inter_700Bold' : 'OpenSans_400Regular',
                  fontSize: 10,
                  color: active ? colors.ink : colors.inkGhost,
                  letterSpacing: 0.2,
                }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
