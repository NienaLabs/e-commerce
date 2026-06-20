import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, useWindowDimensions, Platform } from 'react-native';
import { WebHeader } from '../../components/WebHeader';
import { useRef, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cartStore';

export default function TabLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const totalItems = useCartStore((state) => state.getTotalItems());
  return (
    <View className="flex-1">
      {isDesktop && <WebHeader />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isDesktop ? { display: 'none' } : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            backgroundColor: colors.isDark ? 'rgba(34,32,34,0.8)' : 'rgba(255,255,255,0.85)',
            borderTopWidth: 1,
            borderTopColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            elevation: 0,
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
          },
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarLabelStyle: {
            fontFamily: 'Inter-Bold',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
          },
          tabBarIconStyle: {
            marginTop: 6,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "location" : "location-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarBadge: totalItems > 0 ? totalItems : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.ink },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
