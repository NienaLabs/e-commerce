import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

interface SidebarItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, title, onPress, color }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
        },
      ]}
    >
      <View style={[styles.itemIconContainer, { backgroundColor: colors.surfaceSoft }]}>
        <Ionicons name={icon} size={20} color={color || colors.inkSoft} />
      </View>
      <Text style={[styles.itemText, { color: color || colors.ink }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.inkGhost} />
    </Pressable>
  );
};

export const Sidebar: React.FC = () => {
  const { colors } = useTheme();
  const { user, signOut, hasVendorAccount } = useAuth();
  const { isOpen, close } = useSidebar();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 250 });
      translateX.value = withTiming(0, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 });
    }
  }, [isOpen]);

  const animatedDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      pointerEvents: isOpen ? 'auto' : 'none',
    };
  });

  const handleNavigate = (path: string) => {
    close();
    // Use setTimeout to allow the drawer close animation to finish smoothly
    setTimeout(() => {
      router.push(path as any);
    }, 200);
  };

  const handleLogout = async () => {
    close();
    setTimeout(async () => {
      await signOut();
      router.replace('/(auth)/login');
    }, 200);
  };

  const initials = user?.name
    ? `${user.name.charAt(0)}${user.name.charAt(user.name.length - 1)}`.toUpperCase()
    : 'U';

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
          animatedBackdropStyle,
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={close} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.surface,
            borderRightColor: colors.surfaceMuted,
            shadowColor: '#000',
            shadowOpacity: colors.isDark ? 0.4 : 0.15,
          },
          animatedDrawerStyle,
        ]}
      >
        {/* User Info Header */}
        <View style={[styles.header, { borderBottomColor: colors.surfaceMuted }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: colors.primaryGhost,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.ink }]}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.ink }]} numberOfLines={1}>
                {user?.name ?? 'Guest User'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.inkMuted }]} numberOfLines={1}>
                {user?.email ?? 'Sign in to sync'}
              </Text>
            </View>
          </View>
          <Pressable onPress={close} style={[styles.closeBtn, { backgroundColor: colors.surfaceSoft }]}>
            <Ionicons name="close" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Scrollable Navigation Options */}
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: colors.inkGhost }]}>Shop & Orders</Text>
          <View style={[styles.group, { borderColor: colors.surfaceMuted }]}>
            <SidebarItem icon="home-outline" title="Home" onPress={() => handleNavigate('/')} />
            <SidebarItem icon="cube-outline" title="My Orders" onPress={() => handleNavigate('/profile/orders')} />
            <SidebarItem icon="heart-outline" title="Wishlist" onPress={() => handleNavigate('/profile/wishlist')} />
            <SidebarItem icon="flash-outline" title="Flash Sales" onPress={() => handleNavigate('/flash-sales')} />
            <SidebarItem icon="star-outline" title="Rewards & Loyalty" onPress={() => handleNavigate('/rewards')} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.inkGhost }]}>Settings</Text>
          <View style={[styles.group, { borderColor: colors.surfaceMuted }]}>
            <SidebarItem icon="notifications-outline" title="Notifications" onPress={() => handleNavigate('/profile/notifications')} />
            <SidebarItem icon="options-outline" title="Preferences" onPress={() => handleNavigate('/(auth)/onboarding')} />
            <SidebarItem icon="color-palette-outline" title="Appearance" onPress={() => handleNavigate('/profile/appearance')} />
            <SidebarItem icon="help-circle-outline" title="Help & Support" onPress={() => handleNavigate('/profile/support')} />
          </View>

          {hasVendorAccount ? (
            <View style={[styles.group, { borderColor: colors.surfaceMuted, marginTop: 12 }]}>
              <SidebarItem
                icon="storefront-outline"
                title="Vendor Dashboard"
                onPress={() => handleNavigate('/vendor-dashboard')}
              />
            </View>
          ) : (
            <View style={[styles.group, { borderColor: colors.surfaceMuted, marginTop: 12 }]}>
              <SidebarItem
                icon="storefront-outline"
                title="Become a Vendor"
                onPress={() => handleNavigate('/become-vendor')}
              />
            </View>
          )}

          {/* Logout Section */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                borderColor: colors.errorGhost,
                backgroundColor: pressed ? colors.errorGhost : 'transparent',
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    borderRightWidth: 1,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 16,
    elevation: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: 'OpenSans_400Regular',
    fontSize: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 6,
  },
  group: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
