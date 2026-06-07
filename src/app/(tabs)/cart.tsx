import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getRecommendationShelf, getProductCrossSell } from '../../api/recommendations';
import { getProduct } from '../../api/products';
import { RecommendationShelfRow } from '../../components/RecommendationShelf';

export default function Cart() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getSubtotal = useCartStore((state) => state.getSubtotal);

  const subtotal = getSubtotal();
  const shipping = 5.00;
  const total = subtotal + shipping;

  // ── "Complete the set" — based on the user's purchase history ──
  const { data: completeTheSetShelf } = useQuery({
    queryKey: ['shelf-complete-the-set', token],
    queryFn: () => getRecommendationShelf(token!, 'complete_the_set', 15),
    enabled: !!token && cartItems.length > 0,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // ── Fallback: cross-sell on the first cart item ──
  // Only fires when complete_the_set returned nothing
  const firstCartItemId = cartItems[0]?.id;
  const completeTheSetEmpty = (completeTheSetShelf?.products?.length ?? 0) === 0;

  const { data: crossSellShelf } = useQuery({
    queryKey: ['cart-cross-sell', firstCartItemId],
    queryFn: () => getProductCrossSell(token, firstCartItemId!, 12),
    enabled: !!firstCartItemId && completeTheSetEmpty,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Pick whichever shelf has products
  const activeShelf = (completeTheSetShelf?.products?.length ?? 0) > 0
    ? completeTheSetShelf
    : crossSellShelf;

  // Fetch the exact product details for shelf items (no limit-cap risk)
  const shelfProductIds = React.useMemo(
    () => activeShelf?.products.map(p => p.product_id) ?? [],
    [activeShelf]
  );

  const { data: shelfProductDetails = [] } = useQuery({
    queryKey: ['cart-shelf-product-details', shelfProductIds.join(',')],
    queryFn: () => Promise.all(shelfProductIds.map(id => getProduct(id))),
    enabled: shelfProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const hydratedShelf = React.useMemo(() => {
    if (!activeShelf?.products || shelfProductDetails.length === 0) return [];
    const productMap = Object.fromEntries(shelfProductDetails.map(p => [p.id, p]));
    return activeShelf.products.map(item => {
      const p = productMap[item.product_id];
      if (!p) return null;
      const firstImage =
        p.images?.[0]?.url ??
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
      return {
        product_id: item.product_id,
        name: p.name,
        price: p.actual_price,
        salePrice: p.discount_price ?? undefined,
        imageUrl: firstImage,
        vendorId: p.vendor_id,
        reason_label: item.reason_label,
        has_discount: item.has_discount,
      };
    }).filter(Boolean) as any[];
  }, [activeShelf, shelfProductDetails]);

  // Determine shelf display metadata
  const shelfSlot = (completeTheSetShelf?.products?.length ?? 0) > 0
    ? 'complete_the_set'
    : 'product_cross_sell';
  const shelfLabel = (completeTheSetShelf?.products?.length ?? 0) > 0
    ? 'Complete the set'
    : activeShelf?.label ?? 'You might also like';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + 120) }}>
        {cartItems.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 20 }}>
              {cartItems.map(item => (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.surfaceMuted,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: colors.isDark ? 0.3 : 0.05,
                  shadowRadius: 16,
                  elevation: 2,
                }}>
                  <Image source={{ uri: item.imageUrl }} style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: colors.surfaceSoft }} />
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }} numberOfLines={2}>{item.name}</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 4 }}>Vendor: {item.vendorName || 'Unknown'}</Text>
                      </View>
                      <Pressable style={{ padding: 4 }} onPress={() => removeItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#d93651" />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>
                        ${(item.salePrice ?? item.price).toFixed(2)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 4 }}>
                        <Pressable
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
                        >
                          <Ionicons name="remove" size={16} color={colors.inkSoft} />
                        </Pressable>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginHorizontal: 12 }}>{item.quantity}</Text>
                        <Pressable
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
                        >
                          <Ionicons name="add" size={16} color={colors.inkSoft} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Complete the set / You might also like ── */}
            {hydratedShelf.length > 0 && (
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <RecommendationShelfRow
                  slot={shelfSlot}
                  label={shelfLabel}
                  products={hydratedShelf}
                />
              </View>
            )}

          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 200 }}>
            <Image source={require('@/assets/3d icons/empty cart.png')} style={{ width: 160, height: 160, marginBottom: 24 }} resizeMode="contain" />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 22, color: colors.ink, marginBottom: 8 }}>
              Your cart is empty
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', maxWidth: 240, marginBottom: 32 }}>
              Looks like you haven't added anything to your cart yet.
            </Text>
            <View style={{ width: 240 }}>
              <Button title="Start Shopping" onPress={() => router.push('/(tabs)')} />
            </View>
          </View>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={{ padding: 24, paddingBottom: Math.max(24, insets.bottom + 80), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted }}>
          <Button title="Proceed to Checkout" onPress={() => router.push('/checkout')} />
        </View>
      )}
    </SafeAreaView>
  );
}
