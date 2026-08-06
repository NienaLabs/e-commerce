import React from 'react';
import { View, Text, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppBackground } from '../../components/vendor/kit';
import { VendorDrawerProvider, useVendorDrawer } from '../../context/VendorDrawerContext';

const IS_WEB = Platform.OS === 'web';
const glassBlur = IS_WEB ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any) : {};

const NAV_ITEMS = [
  { icon: 'grid-outline' as const, activeIcon: 'grid' as const, label: 'Dashboard', path: '/vendor-dashboard' },
  { icon: 'cube-outline' as const, activeIcon: 'cube' as const, label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'receipt-outline' as const, activeIcon: 'receipt' as const, label: 'Orders', path: '/vendor-dashboard/orders' },
  { icon: 'headset-outline' as const, activeIcon: 'headset' as const, label: 'Support', path: '/vendor-dashboard/support' },
  { icon: 'settings-outline' as const, activeIcon: 'settings' as const, label: 'Settings', path: '/vendor-dashboard/store-settings' },
];

const SIDE_NAV_ITEMS = [
  { icon: 'grid-outline' as const, activeIcon: 'grid' as const, label: 'Dashboard', path: '/vendor-dashboard' },
  { icon: 'cube-outline' as const, activeIcon: 'cube' as const, label: 'Products', path: '/vendor-dashboard/products' },
  { icon: 'receipt-outline' as const, activeIcon: 'receipt' as const, label: 'Orders', path: '/vendor-dashboard/orders' },
  { icon: 'bar-chart-outline' as const, activeIcon: 'bar-chart' as const, label: 'Analytics', path: '/vendor-dashboard/analytics' },
  { icon: 'receipt-outline' as const, activeIcon: 'receipt' as const, label: 'Commissions', path: '/vendor-dashboard/commissions' },
  { icon: 'headset-outline' as const, activeIcon: 'headset' as const, label: 'Support', path: '/vendor-dashboard/support' },
  { icon: 'settings-outline' as const, activeIcon: 'settings' as const, label: 'Store Settings', path: '/vendor-dashboard/store-settings' },
  { icon: 'arrow-back-outline' as const, activeIcon: 'arrow-back' as const, label: 'Back to Store', path: '/(tabs)' },
];

export default function VendorDashboardLayout() {
  return (
    <VendorDrawerProvider>
      <VendorDashboardShell />
    </VendorDrawerProvider>
  );
}

function VendorDashboardShell() {
  const { colors } = useTheme();
  const { vendor, user, refreshVendor, refreshUser } = useAuth();
  const [isRechecking, setIsRechecking] = React.useState(false);
  const sidebar = useVendorDrawer();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isAdmin = (user as any)?.role === 'admin';

  const isActive = (path: string) => {
    if (path === '/vendor-dashboard') return pathname === '/vendor-dashboard';
    if (path === '/vendor-dashboard/products') {
      return pathname.startsWith('/vendor-dashboard/products') || pathname.startsWith('/vendor-dashboard/add-product');
    }
    if (path === '/vendor-dashboard/orders') {
      return pathname.startsWith('/vendor-dashboard/orders') || pathname.startsWith('/vendor-dashboard/order/');
    }
    if (path === '/vendor-dashboard/store-settings') {
      return pathname.startsWith('/vendor-dashboard/store-settings') || pathname.startsWith('/vendor-dashboard/settings/');
    }
    return pathname.startsWith(path);
  };

  // Only gate verified check for non-admin vendor accounts
  if (!isAdmin && vendor && vendor.is_verified === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <AppBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.warningGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="time-outline" size={52} color={colors.warning} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, marginBottom: 12, textAlign: 'center' }}>Verification Pending</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
            Your store application is currently under review by our admin team. This screen unlocks
            on its own the moment you&apos;re approved — no need to reload the app.
          </Text>
          <Pressable
            onPress={async () => {
              setIsRechecking(true);
              try {
                await Promise.all([refreshVendor(), refreshUser()]);
              } finally {
                setIsRechecking(false);
              }
            }}
            disabled={isRechecking}
            style={{ padding: 16, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', width: '100%', maxWidth: 300, opacity: isRechecking ? 0.6 : 1 }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.onPrimary }}>
              {isRechecking ? 'Checking…' : 'Check status now'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)' as any)} style={{ padding: 16, borderRadius: 12, alignItems: 'center', width: '100%', maxWidth: 300, marginTop: 10 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Back to Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppBackground />

      {/* ─── Mobile Collapsible Drawer Sidebar ─── */}
      {!isDesktop && sidebar.isOpen && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1000, flexDirection: 'row' }}>
          {/* Backdrop */}
          <Pressable
            onPress={() => sidebar.close()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          {/* Drawer Content */}
          <View style={{
            width: 280,
            backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6',
            borderRightWidth: 1,
            borderRightColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 20),
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
          }}>
            <View>
              {/* Store header / Logo */}
              <Pressable
                onPress={() => {
                  sidebar.close();
                  if (vendor?.id) {
                    router.push(`/vendor/${vendor.id}` as any);
                  } else {
                    router.push('/vendor-dashboard' as any);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 30 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                  {vendor?.logo_url ? (
                    <Image source={{ uri: vendor.logo_url }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#29B463' }}>
                      {(vendor?.store_name ?? 'V').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink, letterSpacing: 0.1 }} numberOfLines={1}>
                    {vendor?.store_name ?? 'My Store'}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                    Vendor Portal
                  </Text>
                </View>
              </Pressable>

              {/* Nav links */}
              <View style={{ paddingRight: 16, gap: 4 }}>
                {SIDE_NAV_ITEMS.map(item => {
                  const active = isActive(item.path);
                  const displayLabel = item.label === 'Dashboard' ? 'SUMMARY' :
                    item.label === 'Orders' ? 'ORDERS' :
                      item.label === 'Analytics' ? 'STATISTICS' :
                        item.label === 'Products' ? 'PRODUCT' :
                          item.label === 'Store Settings' ? 'SETTINGS' :
                            item.label.toUpperCase();

                  return (
                    <Pressable
                      key={item.path}
                      onPress={() => {
                        sidebar.close();
                        router.push(item.path as any);
                      }}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 24, paddingVertical: 12,
                        opacity: active ? 1 : pressed ? 0.7 : 0.6,
                      })}
                    >
                      {active && <View style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 4, borderRadius: 4, backgroundColor: colors.primary }} />}
                      <Ionicons name={active ? item.activeIcon : item.icon} size={20} color={active ? colors.ink : colors.inkSoft} style={{ marginRight: 16 }} />
                      <Text style={{ fontFamily: active ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: 13, color: active ? colors.ink : colors.inkSoft, letterSpacing: 0.5 }}>
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bottom User profile */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{
                backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff',
                borderRadius: 16,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(vendor?.logo_url || user?.image) ? (
                    <Image source={{ uri: vendor?.logo_url ?? user?.image ?? '' }} style={{ width: 36, height: 36 }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primaryDim }}>
                      {(vendor?.store_name ?? user?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12.5, color: colors.ink }} numberOfLines={1}>
                    {vendor?.store_name ?? user?.name ?? 'Vendor'}
                  </Text>
                  {!!user?.email && (
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 10, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {/* ─── Desktop Side Nav ─── */}
        {isDesktop && (
          <View style={{
            width: 250,
            backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6',
            borderRightWidth: 1,
            borderRightColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            paddingTop: 32,
            paddingBottom: 24,
            justifyContent: 'space-between'
          }}>
            <View>
              {/* Store header / Logo — real vendor data */}
              <Pressable
                onPress={() => {
                  if (vendor?.id) {
                    router.push(`/vendor/${vendor.id}` as any);
                  } else {
                    router.push('/vendor-dashboard' as any);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 40 }}
              >
                {/* Logo: image if available, else coloured initial */}
                <View style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                  {vendor?.logo_url ? (
                    <Image source={{ uri: vendor.logo_url }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#059669' }}>
                      {(vendor?.store_name ?? 'V').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink, letterSpacing: 0.1 }} numberOfLines={1}>
                    {vendor?.store_name ?? 'My Store'}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                    Vendor Portal
                  </Text>
                </View>
              </Pressable>

              {/* Nav links */}
              <View style={{ paddingRight: 16, gap: 8 }}>
                {SIDE_NAV_ITEMS.map(item => {
                  const active = isActive(item.path);
                  // Map the labels to match the image UI uppercase styling if possible
                  const displayLabel = item.label === 'Dashboard' ? 'SUMMARY' :
                    item.label === 'Orders' ? 'ORDERS' :
                      item.label === 'Analytics' ? 'STATISTICS' :
                        item.label === 'Products' ? 'PRODUCT' :
                          item.label === 'Store Settings' ? 'SETTINGS' :
                            item.label.toUpperCase();

                  if (item.label === 'Support') return null; // Hide extra links for exact UI match

                  return (
                    <Pressable
                      key={item.path}
                      onPress={() => router.push(item.path as any)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 24, paddingVertical: 14,
                        opacity: active ? 1 : pressed ? 0.7 : 0.6,
                      })}
                    >
                      {active && <View style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 4, borderRadius: 4, backgroundColor: colors.primary }} />}
                      <Ionicons name={active ? item.activeIcon : item.icon} size={20} color={active ? colors.ink : colors.inkSoft} style={{ marginRight: 16 }} />
                      <Text style={{ fontFamily: active ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: 13, color: active ? colors.ink : colors.inkSoft, letterSpacing: 0.5 }}>
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bottom user profile — real data from auth context */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{
                backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4
              }}>
                {/* Avatar: prefer vendor logo, fall back to user image, fall back to initials */}
                <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(vendor?.logo_url || user?.image) ? (
                    <Image
                      source={{ uri: vendor?.logo_url ?? user?.image ?? '' }}
                      style={{ width: 44, height: 44 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.primaryDim }}>
                      {(vendor?.store_name ?? user?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                {/* Name info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13.5, color: colors.ink }} numberOfLines={1}>
                    {vendor?.store_name ?? user?.name ?? 'Vendor'}
                  </Text>
                  {!!user?.email && (
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>
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
            backgroundColor: colors.isDark ? 'rgba(40,38,40,0.7)' : 'rgba(255,255,255,0.7)',
            borderTopWidth: 1,
            borderTopColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            shadowColor: '#222022',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: colors.isDark ? 0.3 : 0.06,
            shadowRadius: 16,
            elevation: 8,
            ...glassBlur,
          }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.path);
              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3 }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={active ? item.activeIcon : item.icon} size={23} color={active ? colors.ink : colors.inkGhost} />
                  <Text style={{
                    fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                    fontSize: 10.5,
                    color: active ? colors.ink : colors.inkGhost,
                    letterSpacing: 0.1,
                  }}>
                    {item.label}
                  </Text>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: active ? colors.primary : 'transparent' }} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
