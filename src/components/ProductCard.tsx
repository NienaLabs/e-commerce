import React from 'react';
import { View, Text, Image, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
  onWishlist: () => void;
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
  isWishlisted = false,
}: ProductCardProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const handleVendorPress = (e: any) => {
    e.stopPropagation?.();
    if (vendorId) {
      router.push(`/vendor/${vendorId}` as any);
    }
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    onAddToCart?.();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eceae6',
        padding: 12,
        shadowColor: '#222022',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
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
        backgroundColor: '#f5f5f0',
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
            onWishlist();
          }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#d93651' : '#3a383a'}
          />
        </Pressable>

        {/* Sale badge */}
        {!!salePrice && (
          <View style={{
            position: 'absolute', top: 0, left: 0,
            backgroundColor: '#d93651',
            paddingHorizontal: 10, paddingVertical: 5,
            borderBottomRightRadius: 10,
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#ffffff', letterSpacing: 0.8 }}>
              SALE
            </Text>
          </View>
        )}

        {/* Mobile: floating "+" add to cart button (bottom-right of image) */}
        {!isDesktop && (
          <Pressable
            onPress={handleAddToCart}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: pressed ? '#3a383a' : '#222022',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 5,
            })}
          >
            <Ionicons name="add" size={20} color="#c3d809" />
          </Pressable>
        )}
      </View>

      {/* ── Product Name ── */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: isDesktop ? 14 : 13,
          color: '#222022',
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
        {/* Prices */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
          {salePrice ? (
            <>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 18 : 16, color: '#d93651' }}>
                ${salePrice.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#9e9c9e', textDecorationLine: 'line-through' }}>
                ${price.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: isDesktop ? 18 : 16, color: '#222022' }}>
              ${price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Desktop: "Add to Cart" pill button next to price */}
        {isDesktop && (
          <Pressable
            onPress={handleAddToCart}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? '#3a383a' : '#222022',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 5,
            })}
          >
            <Ionicons name="cart-outline" size={14} color="#c3d809" />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#ffffff' }}>
              Add to Cart
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
            borderTopColor: '#f0eeea',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {/* Vendor Avatar Circle */}
          <View style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: '#f5f5f0',
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: '#eceae6',
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
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c3d80930' }}>
                <Ionicons name="storefront-outline" size={14} color="#7a8a05" />
              </View>
            )}
          </View>

          {/* Vendor Name */}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: '#6b696b',
              flex: 1,
            }}
          >
            {vendorName ?? 'View Store'}
          </Text>

          {/* Arrow hint */}
          <Ionicons name="chevron-forward" size={12} color="#c3d809" />
        </Pressable>
      )}
    </Pressable>
  );
};
