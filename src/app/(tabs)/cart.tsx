import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useQuery, useQueries } from '@tanstack/react-query';
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
  // There is no platform shipping fee — the backend sets SHIPPING_FEE = 0.0 and
  // customers pay the vendor in cash on delivery. A `shipping = 5.00` was being
  // added to a `total` that nothing rendered; live, it would have overstated
  // every basket by $5 against what checkout actually charges.

  // ── Live stock for everything in the cart ──
  // The cart stores a snapshot taken at add-to-cart time, so an item can sell
  // out while it sits here. The backend rejects the order in that case, which
  // surfaced as a raw failure at the very last step. Re-check current stock so
  // the cart can say so up front and refuse to proceed.
  const cartProductIds = React.useMemo(
    () => [...new Set(cartItems.map(i => i.productId))],
    [cartItems],
  );

  // One query per product rather than a single query keyed on the joined ids.
  // With the combined key, adding anything to the cart minted a brand-new key
  // whose data started empty — so every line reverted to "stock unknown" and
  // the checkout button unblocked itself. Adding an in-stock item was enough to
  // let a sold-out one through. Per-product queries keep what they already know.
  const stockQueries = useQueries({
    queries: cartProductIds.map(id => ({
      queryKey: ['cart-stock', id],
      queryFn: () => getProduct(id),
      // Stock is the one thing here that must not be stale.
      staleTime: 0,
      refetchOnWindowFocus: true,
    })),
  });

  const stockByProductId = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of stockQueries) {
      if (q.data) map[q.data.id] = q.data.stock_quantity;
    }
    return map;
  }, [stockQueries]);

  /** True until every cart line has a confirmed stock figure. */
  const stockLoading = stockQueries.some(q => q.isPending);

  /** undefined while stock is still loading — reported as 'unknown'. */
  const availabilityFor = (item: { productId: string; quantity: number }) => {
    const stock = stockByProductId[item.productId];
    if (stock === undefined) return { state: 'unknown' as const, stock };
    if (stock <= 0) return { state: 'out' as const, stock };
    if (stock < item.quantity) return { state: 'partial' as const, stock };
    return { state: 'ok' as const, stock };
  };

  const blockingItems = cartItems.filter(i => {
    const s = availabilityFor(i).state;
    return s === 'out' || s === 'partial';
  });

  // Hold checkout until stock is actually confirmed. Treating "not loaded yet"
  // as available left a window — a second or two on a slow connection, longer
  // on mobile data — where a sold-out basket sailed through to checkout.
  const checkoutBlocked = blockingItems.length > 0 || stockLoading;

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
      const primaryImage = p.images?.find(img => img.is_primary);
      const firstImage =
        (primaryImage ?? p.images?.[0])?.image_url ??
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
      return {
        product_id: item.product_id,
        name: p.name,
        price: p.actual_price,
        salePrice: p.discount_price ?? undefined,
        imageUrl: firstImage,
        vendorId: p.vendor_id,
        vendorName: p.vendor_name ?? undefined,
        vendorAvatar: p.vendor_logo_url ?? undefined,
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
                  {/* The thumbnail is the natural way back to the product. */}
                  <Pressable
                    onPress={() => router.push(`/product/${item.productId}` as any)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${item.name}`}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <Image source={item.imageUrl} style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: colors.surfaceSoft }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={item.id} />
                  </Pressable>
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }} numberOfLines={2}>{item.name}</Text>
                        {/* Only claim a vendor when we actually know one — "Unknown"
                            reads like the store is missing rather than unlabelled. */}
                        {!!item.vendorName && (
                          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 4 }}>Vendor: {item.vendorName}</Text>
                        )}
                        {(() => {
                          const { state, stock } = availabilityFor(item);
                          if (state === 'out') {
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                                <Ionicons name="close-circle" size={14} color={colors.error} />
                                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.error }}>
                                  Out of stock — remove to continue
                                </Text>
                              </View>
                            );
                          }
                          if (state === 'partial') {
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                                <Ionicons name="alert-circle" size={14} color={colors.warning} />
                                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.warning }}>
                                  Only {stock} left — reduce the quantity
                                </Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
                        {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkSoft, marginTop: 4, textTransform: 'capitalize' }}>
                            {Object.entries(item.selectedAttributes).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' | ')}
                          </Text>
                        )}
                      </View>
                      <Pressable style={{ padding: 4 }} onPress={() => removeItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#d93651" />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>
                        {/* Checkout, the order summary and commissions are all
                            in cedis. The cart said "$" for the same number, so
                            the price appeared to change between screens. */}
                        GH₵{(item.salePrice ?? item.price).toFixed(2)}
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
            <Image source={require('@/assets/3d icons/empty cart.png')} style={{ width: 160, height: 160, marginBottom: 24 }} contentFit="contain" />
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
          {/* Only cry wolf about availability once we actually know it —
              while stock is still loading the button simply waits. */}
          {blockingItems.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
              <Ionicons name="warning-outline" size={16} color={colors.error} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 12.5, color: colors.error, lineHeight: 18 }}>
                {blockingItems.length === 1
                  ? '1 item is no longer available in the quantity you selected.'
                  : `${blockingItems.length} items are no longer available in the quantities you selected.`}
              </Text>
            </View>
          )}
          <Button
            title={
              blockingItems.length > 0
                ? 'Resolve items to checkout'
                : stockLoading
                  ? 'Checking availability…'
                  : 'Proceed to Checkout'
            }
            disabled={checkoutBlocked}
            onPress={() => {
              // Belt and braces: the button is disabled, but never let a
              // sold-out basket reach checkout.
              if (checkoutBlocked) return;
              router.push('/checkout');
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
