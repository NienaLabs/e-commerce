import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { CategoryCard } from '../components/CategoryCard';
import { WebHeader } from '../components/WebHeader';

const ALL_CATEGORIES = [
  { id: 'electronics', label: 'Electronics', image: require('@/assets/3d icons/3d-headphones.png') },
  { id: 'fashion', label: 'Fashion', image: require('@/assets/3d icons/3d-clothes.png') },
  { id: 'home', label: 'Home & Living', image: require('@/assets/3d icons/3d-house.png') },
  { id: 'beauty', label: 'Accessories', image: require('@/assets/3d icons/3d-watch.png') },
  { id: 'sports', label: 'Sports', image: require('@/assets/3d icons/3d-sports.png') },
  { id: 'food', label: 'Food & Groceries', image: require('@/assets/3d icons/3d-food.png') },
  { id: 'gaming', label: 'Gaming', image: require('@/assets/3d icons/3d-headphones.png') },
  { id: 'books', label: 'Books', image: require('@/assets/3d icons/3d-house.png') },
  { id: 'toys', label: 'Toys', image: require('@/assets/3d icons/3d-watch.png') },
  { id: 'health', label: 'Health', image: require('@/assets/3d icons/3d-sports.png') },
  { id: 'automotive', label: 'Automotive', image: require('@/assets/3d icons/3d-headphones.png') },
  { id: 'art', label: 'Art & Collectibles', image: require('@/assets/3d icons/3d-house.png') },
];

export default function AllCategoriesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {isDesktop && <WebHeader />}
      
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>All Categories</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
          {ALL_CATEGORIES.map(cat => (
            <View key={cat.id} style={{ width: isDesktop ? '23%' : '47%', marginBottom: 16 }}>
              <CategoryCard
                label={cat.label}
                iconSource={cat.image}
                onPress={() => {
                  router.push({ pathname: '/(tabs)', params: { category: cat.id } });
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
