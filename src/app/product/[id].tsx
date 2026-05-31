import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';

// Mock data fetch
const getProduct = (id: string) => ({
  id,
  name: 'Wireless Noise-Cancelling Headphones',
  description: 'Experience premium sound with our latest noise-cancelling technology. Perfect for commuting, working from home, or just relaxing. Up to 30 hours of battery life.',
  price: 199.99,
  salePrice: 149.99,
  rating: 4.8,
  reviews: 124,
  images: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800',
  ],
  colors: ['Black', 'Silver', 'Navy'],
  inStock: true,
});

export default function ProductDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const product = getProduct(id as string);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  
  const isWishlisted = useWishlistStore((state) => state.items.some(i => i.id === product.id));
  const toggleWishlistItem = useWishlistStore((state) => state.toggleItem);
  
  const addCartItem = useCartStore((state) => state.addItem);
  const totalCartItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

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
              <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {product.salePrice && (
                <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#d93651', paddingHorizontal: 16, paddingVertical: 8, borderBottomRightRadius: 16 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#ffffff', letterSpacing: 1 }}>SALE</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {product.images.map((img, idx) => (
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
                onPress={() => toggleWishlistItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  salePrice: product.salePrice,
                  imageUrl: product.images[0],
                  inStock: product.inStock,
                })}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={24} color={isWishlisted ? colors.primary : colors.ink} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="star" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginRight: 4 }}>{product.rating}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>({product.reviews} reviews)</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 }}>
              {product.salePrice ? (
                <>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: '#d93651', marginRight: 12 }}>${product.salePrice}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 18, color: colors.inkGhost, textDecorationLine: 'line-through', paddingBottom: 4 }}>${product.price}</Text>
                </>
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.ink }}>${product.price}</Text>
              )}
            </View>

            {/* Colors */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Color: {selectedColor}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {product.colors.map(color => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                      backgroundColor: selectedColor === color ? colors.ink : colors.surface,
                      borderWidth: selectedColor === color ? 0 : 1,
                      borderColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: selectedColor === color ? colors.surface : colors.inkSoft }}>
                      {color}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>1-year warranty included</Text>
              </View>
            </View>

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
            ${product.salePrice || product.price}
          </Text>
        </View>
        <View style={{ flex: 2 }}>
          <Button title="Add to Cart" onPress={() => {
            addCartItem({
              id: product.id,
              name: product.name,
              price: product.price,
              salePrice: product.salePrice,
              imageUrl: product.images[0],
              quantity: 1,
            });
            router.push('/(tabs)/cart');
          }} />
        </View>
      </View>
    </SafeAreaView>
  );
}
