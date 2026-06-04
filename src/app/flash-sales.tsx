import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { ProductCard } from '../components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { listProducts, mapProductToCard } from '../api/products';

// Removed static FLASH_PRODUCTS

// End time: 6 hours from now
const END_TIME = Date.now() + 6 * 60 * 60 * 1000;

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs - Date.now());
  useEffect(() => {
    const interval = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);
  const total = Math.max(0, remaining);
  const h = Math.floor(total / 3600000).toString().padStart(2, '0');
  const m = Math.floor((total % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((total % 60000) / 1000).toString().padStart(2, '0');
  return { h, m, s };
}

function TimeUnit({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
      <View style={{ backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 56, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.surface }}>{value}</Text>
      </View>
      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

export default function FlashSalesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { h, m, s } = useCountdown(END_TIME);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['flash-products'],
    queryFn: () => listProducts({ limit: 100 }),
  });

  // Filter products that have a discount
  const flashProducts = products
    .filter(p => p.discount_price != null && p.discount_price < p.actual_price)
    .map(mapProductToCard)
    .slice(0, 10); // Limit to top 10 flash sales

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceMuted,
        paddingBottom: 0,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash" size={22} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>Flash Sale</Text>
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
              Limited time, limited stock — grab it before it's gone!
            </Text>
          </View>
        </View>

        {/* Countdown Banner */}
        <View style={{ backgroundColor: colors.isDark ? '#1a0a00' : '#fff8ed', paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.isDark ? '#2d1500' : '#fde68a40' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#b45309', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Ends In
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TimeUnit value={h} label="Hours" colors={colors} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.inkMuted, marginBottom: 18 }}>:</Text>
            <TimeUnit value={m} label="Mins" colors={colors} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.inkMuted, marginBottom: 18 }}>:</Text>
            <TimeUnit value={s} label="Secs" colors={colors} />
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {isLoading ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', width: '100%', marginTop: 24 }}>Loading flash sales...</Text>
          ) : flashProducts.length === 0 ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', width: '100%', marginTop: 24 }}>No active flash sales right now.</Text>
          ) : flashProducts.map(product => (
            <View key={product.id} style={{ width: isDesktop ? '31%' : '100%' }}>
              {/* Stock badge */}
              {!product.inStock && (
                <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Ionicons name="alert-circle" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#dc2626' }}>Out of stock!</Text>
                </View>
              )}
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
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
