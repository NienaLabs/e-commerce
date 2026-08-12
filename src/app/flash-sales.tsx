import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { ProductCard } from '../components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { getLiveFlashSale, mapProductToCard } from '../api/products';

/**
 * The countdown used to run to `Date.now() + 6 hours`, recomputed on every
 * load, and "flash sale" meant any product that happened to carry a discount.
 * Both now come from the sale the admin scheduled.
 */
function useCountdown(endsAt?: string) {
  const targetMs = endsAt ? new Date(endsAt).getTime() : null;
  const [remaining, setRemaining] = useState(() =>
    targetMs === null ? 0 : targetMs - Date.now()
  );

  useEffect(() => {
    if (targetMs === null) return;
    setRemaining(targetMs - Date.now());
    const interval = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  const total = Math.max(0, remaining);
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000).toString().padStart(2, '0');
  const m = Math.floor((total % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((total % 60000) / 1000).toString().padStart(2, '0');
  return { d, h, m, s, expired: targetMs !== null && total === 0 };
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
  const { data: sale, isLoading } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: getLiveFlashSale,
    // The window matters here — a stale sale would keep counting down after it
    // has actually ended.
    staleTime: 30_000,
  });

  const { d, h, m, s, expired } = useCountdown(sale?.ends_at);

  const flashProducts = (sale?.products ?? []).map(p => {
    const card = mapProductToCard(p);
    // A sale-specific price overrides whatever discount the product carries.
    return p.flash_price != null ? { ...card, salePrice: p.flash_price } : card;
  });

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
            {/* No bolt glyph — the countdown already says "hurry" without it. */}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>
              {sale?.title || 'Flash Sale'}
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
              {sale?.subtitle || 'Limited time offers, while they last.'}
            </Text>
          </View>
        </View>

        {/* Countdown — only when a scheduled sale is actually running. */}
        {sale && !expired && (
        <View style={{ backgroundColor: colors.surfaceSoft, paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Ends In
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {d > 0 && (
              <>
                <TimeUnit value={String(d).padStart(2, '0')} label={d === 1 ? 'Day' : 'Days'} colors={colors} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.inkMuted, marginBottom: 18 }}>:</Text>
              </>
            )}
            <TimeUnit value={h} label="Hours" colors={colors} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.inkMuted, marginBottom: 18 }}>:</Text>
            <TimeUnit value={m} label="Mins" colors={colors} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.inkMuted, marginBottom: 18 }}>:</Text>
            <TimeUnit value={s} label="Secs" colors={colors} />
          </View>
        </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {isLoading ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted, textAlign: 'center', width: '100%', marginTop: 24 }}>Loading flash sales...</Text>
          ) : !sale || expired || flashProducts.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', marginTop: 48, paddingHorizontal: 24 }}>
              <Ionicons name="pricetags-outline" size={44} color={colors.inkGhost} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginTop: 16 }}>
                No sale running
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                There&apos;s no flash sale on at the moment. Check back soon.
              </Text>
            </View>
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
                inStock={product.inStock}
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
