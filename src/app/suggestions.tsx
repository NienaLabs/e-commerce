import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { ProductCard } from '../components/ProductCard';
import { WebHeader } from '../components/WebHeader';
import { useQuery } from '@tanstack/react-query';
import { listProducts, mapProductToCard } from '../api/products';

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'suggestions'],
    queryFn: () => listProducts({ limit: 100 }),
  });

  const mapped = products.map(mapProductToCard);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {isDesktop && <WebHeader />}

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>
          Suggested for You
        </Text>
        {!isLoading && (
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginLeft: 8 }}>
            ({mapped.length})
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>
            Loading products...
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {mapped.map(product => (
              <View key={product.id} style={{ width: isDesktop ? '31%' : '100%', marginBottom: 16 }}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  salePrice={product.salePrice}
                  imageUrl={product.imageUrl}
                  vendorId={product.vendorId}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                />
              </View>
            ))}
          </View>
          {mapped.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="bag-outline" size={64} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.ink }}>No products yet</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
