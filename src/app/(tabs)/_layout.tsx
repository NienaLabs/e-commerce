import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, useWindowDimensions, Platform } from 'react-native';
import { WebHeader } from '../../components/WebHeader';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <View className="flex-1">
      {isDesktop && <WebHeader />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isDesktop ? { display: 'none' } : {
            height: 64,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#eceae6',
            shadowColor: '#222022',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 5,
          },
          tabBarActiveTintColor: '#222022',
          tabBarInactiveTintColor: '#9e9c9e',
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
              <View className="items-center justify-center">
                <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                {focused && <View className="w-1 h-1 rounded-full bg-primary absolute -bottom-5" />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center">
                <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
                {focused && <View className="w-1 h-1 rounded-full bg-primary absolute -bottom-5" />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center">
                <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
                {focused && <View className="w-1 h-1 rounded-full bg-primary absolute -bottom-5" />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center">
                <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                {focused && <View className="w-1 h-1 rounded-full bg-primary absolute -bottom-5" />}
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
