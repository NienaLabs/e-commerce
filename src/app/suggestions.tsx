import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { ProductCard } from '../components/ProductCard';
import { WebHeader } from '../components/WebHeader';

const SUGGESTED_PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 199.99, salePrice: 149.99, category: 'electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Minimalist Smart Watch Series 9', price: 299.00, category: 'electronics', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'Premium Organic Cotton T-Shirt', price: 29.99, salePrice: 19.99, category: 'fashion', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '4', name: 'Artisan Ceramic Coffee Mug Set', price: 38.00, category: 'home', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
  { id: '5', name: 'Running Pro Sneakers Ultra', price: 120.00, salePrice: 89.99, category: 'sports', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '6', name: 'Vitamin C Brightening Serum', price: 45.00, category: 'beauty', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
  { id: '7', name: 'Portable Bluetooth Speaker', price: 79.99, salePrice: 59.99, category: 'electronics', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '10', name: 'Slim-Fit Chino Trousers', price: 58.00, salePrice: 42.00, category: 'fashion', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
];

export default function SuggestionsScreen() {
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
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Suggested for You</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {SUGGESTED_PRODUCTS.map(product => (
            <View key={product.id} style={{ width: isDesktop ? '31%' : '100%', marginBottom: 16 }}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                salePrice={product.salePrice}
                imageUrl={product.image}
                vendorId={product.vendorId}
                vendorName={product.vendorName}
                vendorAvatar={product.vendorAvatar}
                onPress={() => router.push(`/product/${product.id}` as any)}
                onWishlist={() => { }}
                onAddToCart={() => { }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
