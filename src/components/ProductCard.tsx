import React, { useRef, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions, Platform, Animated as RNAnimated } from 'react-native';
import { OptimizedImage } from './ui/OptimizedImage';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, cancelAnimation, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useToast } from '../context/ToastContext';
import { useEventStore } from '../store/eventStore';
import { Skeleton } from './Skeleton';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  onPress: () => void;
  onWishlist?: () => void;
  onAddToCart?: () => void;
  isWishlisted?: boolean;
  /** Defaults to true so existing callers keep working; pass stock_quantity > 0. */
  inStock?: boolean;
}

export const ProductCard = ({
  id,
  name,
  price,
  salePrice,
  imageUrl,
  vendorId,
  vendorName,
  vendorAvatar,
  onPress,
  onWishlist,
  onAddToCart,
  isWishlisted,
  inStock = true,
}: ProductCardProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { showToast } = useToast();
  const addEvent = useEventStore((state) => state.addEvent);

  // ── Hover animation (desktop web only) ──
  const [hoverAnim] = useState(() => new RNAnimated.Value(0));

  const handleMouseEnter = () => {
    if (!isDesktop) return;
    RNAnimated.spring(hoverAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isDesktop) return;
    RNAnimated.spring(hoverAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const hoverScale = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const hoverTranslateY = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  
  const isItemInWishlist = useWishlistStore((state) => state.items.some(i => i.id === id));
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const isHeartFilled = isWishlisted ?? isItemInWishlist;

  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));

  const handleVendorPress = (e: any) => {
    e.stopPropagation?.();
    if (vendorId) router.push(`/vendor/${vendorId}` as any);
  };

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    // Guard as well as disable the control: the card is also reachable by
    // keyboard on web, where a disabled-looking pill can still fire.
    if (!inStock) {
      showToast(`${name} is out of stock`, 'error');
      return;
    }
    // Always add to the global cart store
    addItem({
      id,
      productId: id,
      name,
      price,
      salePrice,
      imageUrl,
      vendorId,
      vendorName,
      vendorAvatar,
      quantity: 1,
    });
    addEvent({
      event_type: 'add_to_cart',
      product_id: id,
      vendor_id: vendorId,
    });
    showToast(`${name} added to cart`, 'success');
    // Also call the optional prop callback (e.g. for local UI feedback)
    onAddToCart?.();
  };

  return (
    <RNAnimated.View
      style={[
        { width: '100%' },
        isDesktop && {
          transform: [{ scale: hoverScale }, { translateY: hoverTranslateY }],
        },
      ]}
      // @ts-ignore — web-only pointer events
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
    <Pressable
      onPress={(e) => {
        addEvent({
          event_type: 'product_view',
          product_id: id,
          vendor_id: vendorId,
        });
        onPress();
      }}
      style={({ pressed }) => ({
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.surfaceMuted,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: colors.isDark ? 0.3 : 0.05,
        shadowRadius: 24,
        elevation: 3,
        transform: pressed ? [{ translateY: 2 }] : [],
        opacity: pressed ? 0.97 : 1,
      })}
    >
      {/* ── Product Image ── */}
      <View style={{
        width: '100%',
        aspectRatio: 1,
        borderRadius: 14,
        backgroundColor: colors.surfaceSoft,
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <OptimizedImage
          source={imageUrl}
          optimizedWidth={isDesktop ? 320 : 200}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          recyclingKey={id}
        />

        {/* Wishlist button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            
            // Trigger animation when liking
            if (!isHeartFilled) {
              cancelAnimation(heartScale);
              heartScale.value = 1;
              heartScale.value = withSequence(
                withTiming(1.3, { duration: 120 }),
                withTiming(1, { duration: 120 })
              );
            }

            toggleItem({ id, name, price, salePrice, imageUrl, vendorId, vendorName, vendorAvatar, inStock });
            if (!isHeartFilled) {
              addEvent({
                event_type: 'add_to_wishlist',
                product_id: id,
                vendor_id: vendorId,
              });
            }
            showToast(
              isHeartFilled ? 'Removed from wishlist' : `${name} added to wishlist`,
              isHeartFilled ? 'info' : 'success'
            );
            onWishlist?.();
          }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: colors.isDark ? 'rgba(34,32,34,0.6)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
          } as any}
        >
          <Animated.View style={heartAnimatedStyle}>
            <Ionicons
              name={isHeartFilled ? 'heart' : 'heart-outline'}
              size={18}
              color={isHeartFilled ? '#d93651' : colors.ink}
            />
          </Animated.View>
        </Pressable>

        {/* Sale badge */}
        {!!salePrice && (
          <View style={{
            position: 'absolute', top: 10, left: 10,
            backgroundColor: '#d93651',
            paddingHorizontal: 8, paddingVertical: 4,
            borderRadius: 8,
            shadowColor: '#d93651', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#ffffff', letterSpacing: 0.5 }}>
              SALE
            </Text>
          </View>
        )}

        {/* Mobile: floating "+" add to cart button */}
        {!isDesktop && (
          <Pressable
            onPress={handleAddToCart}
            disabled={!inStock}
            accessibilityState={{ disabled: !inStock }}
            accessibilityLabel={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 10, right: 10,
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: !inStock ? colors.surfaceMuted : pressed ? colors.primaryDim : colors.primary,
              alignItems: 'center', justifyContent: 'center',
              opacity: inStock ? 1 : 0.7,
              ...(inStock
                ? {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 5,
                  }
                : null),
            })}
          >
            <Ionicons name={inStock ? 'cart' : 'close'} size={18} color={inStock ? colors.ink : colors.inkMuted} />
          </Pressable>
        )}

        {/* Sold-out veil over the image, so the state is obvious at a glance
            rather than only discoverable by tapping a disabled button. */}
        {!inStock && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: colors.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.ink }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.surface, letterSpacing: 0.4 }}>
                OUT OF STOCK
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Product Name ── */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: isDesktop ? 16 : 13,
          color: colors.ink,
          lineHeight: isDesktop ? 22 : 19,
          marginBottom: 6,
          minHeight: isDesktop ? 44 : 36,
        }}
      >
        {name}
      </Text>

      {/* ── Price Row ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
          {salePrice ? (
            <>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 20 : 16, color: '#d93651' }}>
                GH₵{salePrice.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: isDesktop ? 14 : 12, color: colors.inkGhost, textDecorationLine: 'line-through' }}>
                GH₵{price.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 20 : 16, color: colors.ink }}>
              GH₵{price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Desktop: Add to Cart pill — faded and inert when there's no stock,
            so the state is legible before the tap rather than after it. */}
        {isDesktop && (
          <Pressable
            onPress={handleAddToCart}
            disabled={!inStock}
            accessibilityState={{ disabled: !inStock }}
            accessibilityLabel={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: !inStock ? colors.surfaceMuted : pressed ? colors.primaryDim : colors.primary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              gap: 6,
              opacity: inStock ? 1 : 0.6,
              ...(inStock
                ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
                : null),
            })}
          >
            <Ionicons name={inStock ? 'cart' : 'close-circle-outline'} size={16} color={inStock ? colors.ink : colors.inkMuted} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: inStock ? colors.ink : colors.inkMuted }}>
              {inStock ? 'Add' : 'Out of stock'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Vendor Row ── */}
      {(vendorId || vendorName) && (
        <Pressable
          onPress={handleVendorPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.surfaceMuted,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: colors.surfaceSoft,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: colors.surfaceMuted,
            marginRight: 7,
            flexShrink: 0,
          }}>
            {vendorAvatar ? (
              <OptimizedImage
                source={vendorAvatar}
                optimizedWidth={52}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryGhost }}>
                <Ionicons name="storefront-outline" size={14} color="#7a8a05" />
              </View>
            )}
          </View>

          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: colors.inkMuted,
              flex: 1,
            }}
          >
            {vendorName ?? 'View Store'}
          </Text>

          <Ionicons name="chevron-forward" size={12} color={colors.primary} />
        </Pressable>
      )}
    </Pressable>
    </RNAnimated.View>
  );
};

export const ProductCardSkeleton = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.surfaceMuted,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: colors.isDark ? 0.3 : 0.05,
        shadowRadius: 24,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: 14,
          backgroundColor: colors.surfaceSoft,
          marginBottom: 10,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Skeleton width="100%" height="100%" />
      </View>
      <View style={{ marginBottom: 6, minHeight: isDesktop ? 44 : 36, gap: 4 }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Skeleton width={60} height={20} />
      </View>
      <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={26} height={26} borderRadius={13} style={{ marginRight: 7 }} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
};

