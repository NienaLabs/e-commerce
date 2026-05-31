import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { ProductCard } from '../components/ProductCard';

const FLASH_PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 199.99, salePrice: 79.99, stock: 3, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'Premium Organic Cotton T-Shirt', price: 29.99, salePrice: 9.99, stock: 10, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '5', name: 'Running Pro Sneakers Ultra', price: 120.00, salePrice: 59.99, stock: 5, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '7', name: 'Portable Bluetooth Speaker', price: 79.99, salePrice: 29.99, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '6', name: 'Vitamin C Brightening Serum', price: 45.00, salePrice: 18.00, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
  { id: '4', name: 'Artisan Ceramic Coffee Mug Set', price: 38.00, salePrice: 19.00, stock: 7, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
];

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
          {FLASH_PRODUCTS.map(product => (
            <View key={product.id} style={{ width: isDesktop ? '31%' : '100%' }}>
              {/* Stock badge */}
              {product.stock <= 5 && (
                <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Ionicons name="alert-circle" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#dc2626' }}>Only {product.stock} left!</Text>
                </View>
              )}
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                salePrice={product.salePrice}
                imageUrl={product.imageUrl}
                vendorId={product.vendorId}
                vendorName={product.vendorName}
                vendorAvatar={product.vendorAvatar}
                onPress={() => router.push(`/product/${product.id}` as any)}
                onWishlist={() => {}}
                onAddToCart={() => {}}
              />
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
