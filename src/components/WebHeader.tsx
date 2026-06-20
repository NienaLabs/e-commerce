import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useNotificationStore } from '../store/notificationStore';
import { useSidebar } from '../context/SidebarContext';

export const WebHeader = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const totalItems = useCartStore((state) => state.getTotalItems());
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());
  const { user } = useAuth();
  const { toggle } = useSidebar();

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
      {/* Brand Logo with Hamburger */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable onPress={toggle} style={{ padding: 4, cursor: 'pointer' } as any}>
          <Ionicons name="menu" size={28} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => handleNav('/')} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cube" size={32} color={colors.primary} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, marginLeft: 8 }}>Electric</Text>
        </Pressable>
      </View>

      {/* Navigation Links */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
        {[
          { label: 'Home', path: '/' },
          { label: 'Discover', path: '/discover' },
          { label: 'Search', path: '/search' },
          { label: 'Cart', path: '/cart', badge: totalItems > 0 ? totalItems.toString() : undefined },
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

        {/* Notification Bell */}
        <Pressable
          onPress={() => handleNav('/notifications')}
          style={{ paddingBottom: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: isActive('/notifications') ? colors.primary : 'transparent' }}
        >
          <View>
            <Ionicons name={isActive('/notifications') ? "notifications" : "notifications-outline"} size={22} color={isActive('/notifications') ? colors.ink : colors.inkMuted} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 4, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#fff' }}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Profile Link */}
        <Pressable
          onPress={() => handleNav('/profile')}
          style={{ paddingBottom: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: isActive('/profile') ? colors.primary : 'transparent' }}
        >
          {user?.image ? (
            <Image source={{ uri: user.image }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
          ) : (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.ink }}>
                {user?.name ? `${user.name.charAt(0)}${user.name.charAt(user.name.length - 1)}`.toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: isActive('/profile') ? colors.ink : colors.inkMuted }}>
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
