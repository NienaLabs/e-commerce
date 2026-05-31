import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';

export default function WishlistScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const addCartItem = useCartStore((state) => state.addItem);

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      if (item.inStock) {
        addCartItem({
          id: item.id,
          name: item.name,
          price: item.price,
          salePrice: item.salePrice,
          imageUrl: item.imageUrl,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          vendorAvatar: item.vendorAvatar,
          quantity: 1,
        });
      }
    });
    router.push('/(tabs)/cart');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>
          Wishlist {items.length > 0 ? `(${items.length})` : ''}
        </Text>
        {items.length > 0 && (
          <Pressable onPress={handleAddAllToCart} style={{ backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.surface }}>Add All to Cart</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="heart" size={40} color={colors.primaryDim} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginBottom: 8 }}>Nothing saved yet</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 32 }}>
            Tap the heart icon on any product to save it here for later.
          </Text>
          <View style={{ width: 220 }}>
            <Button title="Start Browsing" onPress={() => router.replace('/(tabs)')} />
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/product/${item.id}` as any)}
              style={{ backgroundColor: colors.surface, borderRadius: 20, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceMuted, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <Image source={{ uri: item.imageUrl }} style={{ width: 100, height: 100 }} resizeMode="cover" />
              <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginBottom: 4 }} numberOfLines={2}>{item.name}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>{item.vendorName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.salePrice ? (
                      <>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#d93651' }}>${item.salePrice}</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, textDecorationLine: 'line-through' }}>${item.price}</Text>
                      </>
                    ) : (
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>${item.price}</Text>
                    )}
                    {!item.inStock && (
                      <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#dc2626' }}>Out of Stock</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {item.inStock && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          addCartItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            salePrice: item.salePrice,
                            imageUrl: item.imageUrl,
                            vendorId: item.vendorId,
                            vendorName: item.vendorName,
                            vendorAvatar: item.vendorAvatar,
                            quantity: 1,
                          });
                        }}
                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="cart" size={18} color={colors.surface} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        removeItem(item.id);
                      }}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="trash" size={16} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
