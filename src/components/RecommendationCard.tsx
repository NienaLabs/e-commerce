import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useToast } from '../context/ToastContext';
import { useEventStore } from '../store/eventStore';

interface RecommendationCardProps {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  reasonLabel?: string;
  hasDiscount?: boolean;
  onPress?: () => void;
}

export const RecommendationCard = ({
  id,
  name,
  price,
  salePrice,
  imageUrl,
  vendorId,
  vendorName,
  vendorAvatar,
  reasonLabel,
  hasDiscount,
  onPress,
}: RecommendationCardProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);
  const addEvent = useEventStore((state) => state.addEvent);

  const isItemInWishlist = useWishlistStore((state) =>
    state.items.some((i) => i.id === id)
  );
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const addItem = useCartStore((state) => state.addItem);

  const CARD_WIDTH = isDesktop ? 240 : 160;
  const IMAGE_HEIGHT = isDesktop ? 210 : 150;

  // ── Hover animation (desktop web only) ──
  const hoverAnim = useRef(new Animated.Value(0)).current;

  const handleMouseEnter = () => {
    if (!isDesktop) return;
    Animated.spring(hoverAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 280,
      friction: 18,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isDesktop) return;
    Animated.spring(hoverAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 280,
      friction: 18,
    }).start();
  };

  const hoverScale = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const hoverTranslateY = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    addItem({
      id,
      name,
      price,
      salePrice,
      imageUrl,
      vendorId,
      vendorName,
      quantity: 1,
    });
    addEvent({
      event_type: 'add_to_cart',
      product_id: id,
      vendor_id: vendorId,
    });
    showToast(`${name} added to cart`, 'success');
  };

  const handleWishlistToggle = (e: any) => {
    e.stopPropagation?.();
    toggleItem({
      id,
      name,
      price,
      salePrice,
      imageUrl,
      vendorId,
      vendorName,
      inStock: true,
    });
    
    if (!isItemInWishlist) {
      addEvent({
        event_type: 'add_to_wishlist',
        product_id: id,
        vendor_id: vendorId,
      });
    }

    showToast(
      isItemInWishlist ? 'Removed from wishlist' : `${name} added to wishlist`,
      isItemInWishlist ? 'info' : 'success'
    );
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';

  const displayPrice = salePrice ?? price;
  const discountPercent =
    salePrice && price > salePrice
      ? Math.round(((price - salePrice) / price) * 100)
      : 0;

  return (
    <Animated.View
      style={[
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
        if (onPress) {
          onPress();
        } else {
          router.push(`/product/${id}` as any);
        }
      }}
      style={({ pressed }) => ({
        width: CARD_WIDTH,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: pressed ? colors.primaryBorder : colors.surfaceMuted,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: colors.isDark ? 0.35 : 0.06,
        shadowRadius: 16,
        elevation: 4,
        transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
      })}
    >
      {/* ── Image ── */}
      <View
        style={{
          width: '100%',
          height: IMAGE_HEIGHT,
          backgroundColor: colors.surfaceSoft,
          position: 'relative',
        }}
      >
        <Image
          source={{ uri: imageError ? fallbackImage : imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {/* Wishlist heart */}
        <Pressable
          onPress={handleWishlistToggle}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.isDark
              ? 'rgba(34,32,34,0.65)'
              : 'rgba(255,255,255,0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.4)',
          } as any}
        >
          <Ionicons
            name={isItemInWishlist ? 'heart' : 'heart-outline'}
            size={15}
            color={isItemInWishlist ? '#d93651' : colors.ink}
          />
        </Pressable>

        {/* Discount badge */}
        {(hasDiscount || discountPercent > 0) && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#d93651',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 9,
                color: '#fff',
                letterSpacing: 0.4,
              }}
            >
              {discountPercent > 0 ? `-${discountPercent}%` : 'SALE'}
            </Text>
          </View>
        )}

        {/* Quick add to cart */}
        <Pressable
          onPress={handleAddToCart}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: pressed ? colors.primaryDim : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          })}
        >
          <Ionicons name="cart" size={16} color={colors.isDark ? '#222022' : '#222022'} />
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={{ padding: 10 }}>
        {/* Product name */}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: isDesktop ? 14 : 12,
            color: colors.ink,
            lineHeight: isDesktop ? 18 : 16,
            marginBottom: 6,
            minHeight: isDesktop ? 36 : 32,
          }}
        >
          {name}
        </Text>

        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: isDesktop ? 16 : 14,
              color: salePrice ? '#d93651' : colors.ink,
            }}
          >
            ${displayPrice.toFixed(2)}
          </Text>
          {salePrice && price > salePrice && (
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 10,
                color: colors.inkGhost,
                textDecorationLine: 'line-through',
              }}
            >
              ${price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* ── Vendor Row ── */}
        {(vendorId || vendorName) && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              if (vendorId) router.push(`/vendor/${vendorId}` as any);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 8,
              marginTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.surfaceMuted,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: colors.surfaceSoft,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.surfaceMuted,
              marginRight: 6,
              flexShrink: 0,
            }}>
              {vendorAvatar ? (
                <Image source={{ uri: vendorAvatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryGhost }}>
                  <Ionicons name="storefront-outline" size={10} color="#7a8a05" />
                </View>
              )}
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 10,
                color: colors.inkMuted,
                flex: 1,
              }}
            >
              {vendorName ?? 'View Store'}
            </Text>

            <Ionicons name="chevron-forward" size={10} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </Pressable>
    </Animated.View>
  );
};
