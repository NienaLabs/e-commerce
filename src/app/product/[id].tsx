import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useQuery } from '@tanstack/react-query';
import { getProduct as fetchProduct } from '../../api/products';
import { useToast } from '../../context/ToastContext';
import { getLocalReviews, LocalReview } from '../../api/localReviews';
import { getProductCrossSell } from '../../api/recommendations';
import { useAuth } from '../../context/AuthContext';
import { getProduct } from '../../api/products';
import { RecommendationShelfRow } from '../../components/RecommendationShelf';

export default function ProductDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id as string;
  const { showToast } = useToast();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  });

  const { data: localReviews = [] } = useQuery({
    queryKey: ['local-reviews', productId],
    queryFn: () => getLocalReviews(productId),
    enabled: !!productId,
  });

  const { token } = useAuth();
  
  const { data: crossSellShelf, isLoading: crossSellLoading } = useQuery({
    queryKey: ['cross-sell', productId],
    queryFn: () => getProductCrossSell(token, productId, 15),
    enabled: !!productId,
  });

  // Fetch only the specific product IDs that the cross-sell returned,
  // so hydration never silently drops items that fall outside a generic
  // "limit: 200" all-products cache.
  const crossSellProductIds = React.useMemo(
    () => crossSellShelf?.products.map(p => p.product_id) ?? [],
    [crossSellShelf]
  );

  const { data: crossSellProductDetails = [] } = useQuery({
    queryKey: ['cross-sell-product-details', crossSellProductIds.join(',')],
    queryFn: () => Promise.all(crossSellProductIds.map(id => getProduct(id))),
    enabled: crossSellProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const hydratedCrossSell = React.useMemo(() => {
    if (!crossSellShelf?.products || crossSellProductDetails.length === 0) return [];
    const productMap = Object.fromEntries(crossSellProductDetails.map(p => [p.id, p]));
    return crossSellShelf.products.map(item => {
      const p = productMap[item.product_id];
      if (!p) return null;
      const primaryImage = p.images?.find(img => img.is_primary);
      const firstImage = (primaryImage ?? p.images?.[0])?.image_url ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
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
  }, [crossSellShelf, crossSellProductDetails]);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const REVIEWS_PAGE_SIZE = 5;

  const isWishlisted = useWishlistStore((state) => state.items.some(i => i.id === productId));
  const toggleWishlistItem = useWishlistStore((state) => state.toggleItem);

  const addCartItem = useCartStore((state) => state.addItem);
  const totalCartItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32 }} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.inkGhost} />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginTop: 16, marginBottom: 8 }}>Product not found</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>This product may have been removed.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ink, borderRadius: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', color: colors.surface }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const productColors = product.colors.map(c => c.name);
  const productImages = product.images.map(i => i.image_url);
  const firstImage = productImages[0] ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800';
  const displayColors = productColors.length > 0 ? productColors : ['Default'];
  const currentColor = selectedColor || displayColors[0];
  const inStock = product.stock_quantity > 0;

  const totalReviewsCount = product.review_count + localReviews.length;
  // Calculate average rating considering local reviews
  const totalBackendScore = product.avg_rating * product.review_count;
  const totalLocalScore = localReviews.reduce((sum, r) => sum + r.rating, 0);
  const displayRating = totalReviewsCount === 0 ? 0 : (totalBackendScore + totalLocalScore) / totalReviewsCount;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, zIndex: 10 }}>
        <Pressable 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, flex: 1, textAlign: 'center' }}>Details</Text>
        <Pressable 
          onPress={() => router.push('/cart')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="cart-outline" size={24} color={colors.ink} />
          {totalCartItems > 0 && (
            <View style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.isDark ? colors.ink : '#222022' }}>{totalCartItems}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', padding: 24, gap: 32 }}>
          
          {/* Image Gallery */}
          <View style={{ flex: isDesktop ? 1 : undefined }}>
            <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceSoft, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
              <Image source={{ uri: firstImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {product.discount_price && (
                <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#d93651', paddingHorizontal: 16, paddingVertical: 8, borderBottomRightRadius: 16 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#ffffff', letterSpacing: 1 }}>SALE</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {productImages.map((img, idx) => (
                <View key={idx} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: idx === 0 ? 2 : 1, borderColor: idx === 0 ? colors.primary : colors.surfaceMuted, overflow: 'hidden' }}>
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} />
                </View>
              ))}
            </View>
          </View>

          {/* Product Info */}
          <View style={{ flex: isDesktop ? 1 : undefined }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, lineHeight: 32, marginRight: 16 }}>
                {product.name}
              </Text>
              <Pressable 
                onPress={() => {
                  toggleWishlistItem({
                    id: product.id,
                    name: product.name,
                    price: product.actual_price,
                    salePrice: product.discount_price ?? undefined,
                    imageUrl: firstImage,
                    inStock,
                  });
                  showToast(
                    isWishlisted ? 'Removed from wishlist' : `${product.name} added to wishlist`,
                    isWishlisted ? 'info' : 'success'
                  );
                }}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={24} color={isWishlisted ? colors.primary : colors.ink} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="star" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginRight: 4 }}>{displayRating.toFixed(1)}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>({totalReviewsCount} reviews)</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 }}>
              {product.discount_price ? (
                <>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: '#d93651', marginRight: 12 }}>${product.discount_price}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 18, color: colors.inkGhost, textDecorationLine: 'line-through', paddingBottom: 4 }}>${product.actual_price}</Text>
                </>
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.ink }}>${product.actual_price}</Text>
              )}
            </View>

            {/* Colors */}
            {displayColors.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Color: {currentColor}</Text>
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  {displayColors.map(color => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={{
                        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                        backgroundColor: currentColor === color ? colors.ink : colors.surface,
                        borderWidth: currentColor === color ? 0 : 1,
                        borderColor: colors.surfaceMuted,
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: currentColor === color ? colors.surface : colors.inkSoft }}>
                        {color}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 12 }}>Description</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, lineHeight: 24 }}>
                {product.description}
              </Text>
            </View>
            
            {/* Benefits */}
            <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 20, marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Free 2-day delivery</Text>
              </View>
              {product.warranty_info ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>{product.warranty_info}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>1-year warranty included</Text>
                </View>
              )}
            </View>

            {/* Customer Reviews */}
            <View style={{ marginBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Customer Reviews</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryGhost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Ionicons name="star" size={13} color={colors.primaryDim} style={{ marginRight: 4 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.primaryDim }}>{displayRating.toFixed(1)}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.primaryDim, marginLeft: 4 }}>({totalReviewsCount})</Text>
                </View>
              </View>
              
              {localReviews.length === 0 ? (
                <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 24, alignItems: 'center' }}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.surfaceMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkMuted }}>No reviews yet</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 4, textAlign: 'center' }}>
                    Buy this product to leave the first review!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {(showAllReviews ? localReviews : localReviews.slice(0, REVIEWS_PAGE_SIZE)).map(review => (
                    <View key={review.id} style={{ backgroundColor: colors.surfaceSoft, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>{review.userName}</Text>
                        <View style={{ flexDirection: 'row' }}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons key={i} name={i < review.rating ? "star" : "star-outline"} size={14} color={colors.primary} />
                          ))}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {review.isVerifiedPurchase && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successGhost, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Ionicons name="checkmark-circle" size={10} color={colors.success} style={{ marginRight: 4 }} />
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.success }}>Verified Purchase</Text>
                          </View>
                        )}
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginLeft: review.isVerifiedPurchase ? 8 : 0 }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {review.title ? <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginBottom: 4 }}>{review.title}</Text> : null}
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 22 }}>{review.body}</Text>
                    </View>
                  ))}

                  {localReviews.length > REVIEWS_PAGE_SIZE && (
                    <Pressable
                      onPress={() => setShowAllReviews(prev => !prev)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 14,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: colors.surfaceMuted,
                        backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft,
                        gap: 8,
                      })}
                    >
                      <Ionicons
                        name={showAllReviews ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.inkSoft}
                      />
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>
                        {showAllReviews
                          ? 'Show Less'
                          : `Show All ${localReviews.length} Reviews`
                        }
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* Complete Your Cart / Cross-Sell */}
            {(hydratedCrossSell.length > 0 || crossSellLoading) && (
              <View style={{ marginBottom: 40, marginHorizontal: -24 }}>
                <RecommendationShelfRow
                  slot={crossSellShelf?.slot || 'product_cross_sell'}
                  label={crossSellShelf?.label || 'Frequently bought together'}
                  products={hydratedCrossSell}
                  isLoading={crossSellLoading}
                />
              </View>
            )}

          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={{ 
        flexDirection: 'row', alignItems: 'center', padding: 20, 
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20
      }}>
        <View style={{ flex: 1, marginRight: 20 }}>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 2 }}>Total Price</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>
            ${product.discount_price ?? product.actual_price}
          </Text>
        </View>
        <View style={{ flex: 2 }}>
          <Button
            title={inStock ? 'Add to Cart' : 'Out of Stock'}
            onPress={() => {
              if (!inStock) return;
              addCartItem({
                id: product.id,
                name: product.name,
                price: product.actual_price,
                salePrice: product.discount_price ?? undefined,
                imageUrl: firstImage,
                quantity: 1,
              });
              showToast(`${product.name} added to cart`, 'success');
              router.push('/(tabs)/cart');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
