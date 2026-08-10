import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { Skeleton } from '../../components/Skeleton';

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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const REVIEWS_PAGE_SIZE = 5;

  const isWishlisted = useWishlistStore((state) => state.items.some(i => i.id === productId));
  const toggleWishlistItem = useWishlistStore((state) => state.toggleItem);

  const addCartItem = useCartStore((state) => state.addItem);
  const totalCartItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const isNarrow = width < 400;
  // Screen gutter: 24px is too tight once you're on a 360px phone.
  const gutter = isNarrow ? 16 : isDesktop ? 24 : 20;
  const MAX_CONTENT_WIDTH = 1200;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
        {/* Header Skeleton */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, paddingVertical: 16 }}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width={120} height={20} />
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>
        
        <View style={{
          flexDirection: isDesktop ? 'row' : 'column',
          padding: gutter,
          gap: isDesktop ? 32 : 24,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}>
          {/* Image Gallery Skeleton */}
          <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
            <View style={{ width: '100%', aspectRatio: 1, marginBottom: 16 }}>
              <Skeleton width="100%" height="100%" borderRadius={24} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width={72} height={72} borderRadius={12} />
              <Skeleton width={72} height={72} borderRadius={12} />
              <Skeleton width={72} height={72} borderRadius={12} />
              <Skeleton width={72} height={72} borderRadius={12} />
            </View>
          </View>

          {/* Info Skeleton */}
          <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
            <Skeleton width="80%" height={32} style={{ marginBottom: 12 }} />
            <Skeleton width="40%" height={20} style={{ marginBottom: 24 }} />
            <Skeleton width="30%" height={40} style={{ marginBottom: 32 }} />
            
            <Skeleton width="100%" height={24} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 32 }} />
          </View>
        </View>
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
  const displayImage = productImages[selectedImageIndex] ?? firstImage;
  const displayColors = productColors.length > 0 ? productColors : ['Default'];
  const currentColor = selectedColor || displayColors[0];
  const inStock = product.stock_quantity > 0;

  const variantAttributes = Object.entries(product.attributes || {}).filter(([k, v]) => Array.isArray(v) && v.length > 1);
  const specAttributes = Object.entries(product.attributes || {}).filter(([k, v]) => !Array.isArray(v) || v.length <= 1);

  const totalReviewsCount = product.review_count + localReviews.length;
  // Calculate average rating considering local reviews
  const totalBackendScore = product.avg_rating * product.review_count;
  const totalLocalScore = localReviews.reduce((sum, r) => sum + r.rating, 0);
  const displayRating = totalReviewsCount === 0 ? 0 : (totalBackendScore + totalLocalScore) / totalReviewsCount;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: gutter, paddingVertical: 16, backgroundColor: colors.surface, zIndex: 10 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, flex: 1, textAlign: 'center' }}>Details</Text>
        <Pressable 
          onPress={() => router.push('/cart')}
          accessibilityRole="button"
          accessibilityLabel="Open cart"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Ionicons name="cart-outline" size={24} color={colors.ink} />
          {totalCartItems > 0 && (
            <View style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.onPrimary }}>{totalCartItems}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{
          flexDirection: isDesktop ? 'row' : 'column',
          padding: gutter,
          gap: isDesktop ? 32 : 24,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}>

          {/* Image Gallery */}
          <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
            <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceSoft, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
              {/* Full-size original on purpose — this is the one place the
                  shopper actually inspects the photo. Lists use the thumbnail
                  rendition via sizedImageUrl. */}
              <OptimizedImage
                source={displayImage}
                optimizedWidth={800}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={product.id}
                priority="high"
              />
              {product.discount_price && (
                <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#d93651', paddingHorizontal: 16, paddingVertical: 8, borderBottomRightRadius: 16 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#ffffff', letterSpacing: 1 }}>SALE</Text>
                </View>
              )}
            </View>
            {/* Four 72px thumbs plus gaps are wider than a 360px screen, so the
                strip scrolls horizontally rather than clipping the last one. */}
            {productImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingRight: 4 }}
              >
                {productImages.map((img, idx) => (
                  <View key={idx} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: idx === 0 ? 2 : 1, borderColor: idx === 0 ? colors.primary : colors.surfaceMuted, overflow: 'hidden', flexShrink: 0 }}>
                    <OptimizedImage source={img} optimizedWidth={144} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {productImages.map((img, idx) => (
                <Pressable 
                  key={idx} 
                  onPress={() => setSelectedImageIndex(idx)}
                  style={{ width: 72, height: 72, borderRadius: 12, borderWidth: idx === selectedImageIndex ? 2 : 1, borderColor: idx === selectedImageIndex ? colors.primary : colors.surfaceMuted, overflow: 'hidden' }}
                >
                  <OptimizedImage source={img} optimizedWidth={144} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Product Info */}
          <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 22 : 26, color: colors.ink, lineHeight: isNarrow ? 28 : 32, marginRight: 16 }}>
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
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={24} color={isWishlisted ? colors.primary : colors.ink} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="star" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginRight: 4 }}>{displayRating.toFixed(1)}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>({totalReviewsCount} reviews)</Text>
            </View>

            {/* Wraps so a long discounted price and its struck-through original
                don't run off the edge of a narrow screen. */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              {product.discount_price ? (
                <>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 27 : 32, color: '#d93651' }}>GH₵{product.discount_price}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: isNarrow ? 16 : 18, color: colors.inkGhost, textDecorationLine: 'line-through', paddingBottom: 4 }}>GH₵{product.actual_price}</Text>
                </>
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 27 : 32, color: colors.ink }}>GH₵{product.actual_price}</Text>
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

            {/* Variants */}
            {variantAttributes.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                {variantAttributes.map(([key, options]) => (
                  <View key={key} style={{ marginBottom: 16 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12, textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                      {(options as string[]).map((opt) => {
                        const isSelected = selectedVariants[key] === String(opt);
                        return (
                          <Pressable
                            key={String(opt)}
                            onPress={() => setSelectedVariants(prev => ({ ...prev, [key]: String(opt) }))}
                            style={{
                              paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                              backgroundColor: isSelected ? colors.ink : colors.surface,
                              borderWidth: isSelected ? 0 : 1,
                              borderColor: colors.surfaceMuted,
                            }}
                          >
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: isSelected ? colors.surface : colors.inkSoft }}>
                              {String(opt).replace(/_/g, ' ')}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Description */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 12 }}>Description</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, lineHeight: 24 }}>
                {product.description}
              </Text>
            </View>

            {/* Specifications */}
            {specAttributes.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 12 }}>Specifications</Text>
                <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 16 }}>
                  {specAttributes.map(([key, value], idx, arr) => (
                    <View key={key} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: idx === arr.length - 1 ? 0 : 1, borderBottomColor: colors.surfaceMuted }}>
                      <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted, textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text style={{ flex: 2, fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink }}>
                        {Array.isArray(value) ? value.map(v => String(v).replace(/_/g, ' ')).join(', ') : String(value).replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Benefits — only what the vendor actually stated. Delivery speed
                and warranty length were hardcoded promises the platform can't
                keep on every vendor's behalf, so the block now renders only
                when there is real warranty info to show. */}
            {!!product.warranty_info && (
              <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, padding: 20, marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>{product.warranty_info}</Text>
                </View>
              </View>
            )}

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
              <View style={{ marginBottom: 40, marginHorizontal: -gutter }}>
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

      {/* Sticky Bottom Bar — padded to the device's real bottom inset so the
          CTA never sits under the home indicator or gesture pill. */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: gutter, paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted,
        width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center',
      }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 2 }}>Total Price</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 19 : 22, color: colors.ink }}>
            GH₵{product.discount_price ?? product.actual_price}
          </Text>
        </View>
        <View style={{ flex: 2, minWidth: 0 }}>
          <Button
            title={inStock ? 'Add to Cart' : 'Out of Stock'}
            // The tap was already a no-op when out of stock, but the button
            // still looked live. Fade it so the state reads before the tap.
            disabled={!inStock}
            onPress={() => {
              if (!inStock) return;
              
              const missingVariants = variantAttributes.filter(([key]) => !selectedVariants[key]).map(([key]) => key);
              if (missingVariants.length > 0) {
                showToast(`Please select: ${missingVariants.map(k => k.replace(/_/g, ' ')).join(', ')}`, 'error');
                return;
              }

              const finalAttributes = { ...selectedVariants };
              if (displayColors.length > 1 || (displayColors.length === 1 && displayColors[0] !== 'Default')) {
                 finalAttributes['Color'] = currentColor;
              }

              const cartItemId = `${product.id}-${JSON.stringify(finalAttributes)}`;

              addCartItem({
                id: cartItemId,
                productId: product.id,
                name: product.name,
                price: product.actual_price,
                salePrice: product.discount_price ?? undefined,
                imageUrl: firstImage,
                // Without these the cart row falls back to "Vendor: Unknown".
                // Adding from a product card passed them; adding from the
                // detail page did not, which is the common path.
                vendorId: product.vendor_id,
                vendorName: product.vendor_name ?? undefined,
                vendorAvatar: product.vendor_logo_url ?? undefined,
                quantity: 1,
                selectedAttributes: Object.keys(finalAttributes).length > 0 ? finalAttributes : undefined,
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
