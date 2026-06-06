import React from 'react';
import { View, Text, Image, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useToast } from '../context/ToastContext';
import { useEventStore } from '../store/eventStore';

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
}: ProductCardProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { showToast } = useToast();
  const addEvent = useEventStore((state) => state.addEvent);
  
  const isItemInWishlist = useWishlistStore((state) => state.items.some(i => i.id === id));
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const isHeartFilled = isWishlisted ?? isItemInWishlist;

  const handleVendorPress = (e: any) => {
    e.stopPropagation?.();
    if (vendorId) router.push(`/vendor/${vendorId}` as any);
  };

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    // Always add to the global cart store
    addItem({
      id,
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
        aspectRatio: isDesktop ? 4 / 3 : 1,
        borderRadius: 14,
        backgroundColor: colors.surfaceSoft,
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Wishlist button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggleItem({ id, name, price, salePrice, imageUrl, vendorId, vendorName, vendorAvatar, inStock: true });
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
          <Ionicons
            name={isHeartFilled ? 'heart' : 'heart-outline'}
            size={18}
            color={isHeartFilled ? '#d93651' : colors.ink}
          />
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
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 10, right: 10,
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: pressed ? colors.primaryDim : colors.primary,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 5,
            })}
          >
            <Ionicons name="cart" size={18} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {/* ── Product Name ── */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: isDesktop ? 14 : 13,
          color: colors.ink,
          lineHeight: 19,
          marginBottom: 6,
          minHeight: isDesktop ? 38 : 36,
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
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 18 : 16, color: '#d93651' }}>
                ${salePrice.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textDecorationLine: 'line-through' }}>
                ${price.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 18 : 16, color: colors.ink }}>
              ${price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Desktop: Add to Cart pill */}
        {isDesktop && (
          <Pressable
            onPress={handleAddToCart}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.primaryDim : colors.primary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              gap: 6,
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
            })}
          >
            <Ionicons name="cart" size={16} color={colors.ink} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink }}>
              Add
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
              <Image
                source={{ uri: vendorAvatar }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
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
  );
};
