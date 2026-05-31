import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';

export const WebHeader = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const totalItems = useCartStore((state) => state.getTotalItems());

  if (!isDesktop) return null;

  const handleNav = (path: string) => { router.navigate(path as any); };
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/(tabs)';
    return pathname.includes(path);
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceMuted,
      zIndex: 50,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.isDark ? 0.3 : 0.08,
      shadowRadius: 8,
    }}>
      {/* Brand Logo */}
      <Pressable onPress={() => handleNav('/')} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cube" size={32} color={colors.primary} />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, marginLeft: 8 }}>Electric</Text>
      </Pressable>

      {/* Navigation Links */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
        {[
          { label: 'Home', path: '/' },
          { label: 'Discover', path: '/discover' },
          { label: 'Search', path: '/search' },
          { label: 'Cart', path: '/cart', badge: totalItems > 0 ? totalItems.toString() : undefined },
          { label: 'Profile', path: '/profile' },
        ].map(({ label, path, badge }) => (
          <Pressable
            key={path}
            onPress={() => handleNav(path)}
            style={{ paddingBottom: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: isActive(path) ? colors.primary : 'transparent' }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: isActive(path) ? colors.ink : colors.inkMuted }}>
              {label}
            </Text>
            {badge && (
              <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.ink }}>{badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};
