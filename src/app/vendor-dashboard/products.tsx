import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, useWindowDimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 199.99, stock: 14, status: 'active', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200' },
  { id: '7', name: 'Portable Bluetooth Speaker', price: 79.99, stock: 8, status: 'active', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Minimalist Smart Watch Series 9', price: 299.00, stock: 3, status: 'active', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=200' },
  { id: '8', name: 'Studio Monitor Earbuds Pro', price: 159.00, stock: 0, status: 'out_of_stock', image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&q=80&w=200' },
  { id: 'new1', name: 'Over-Ear Gaming Headset RGB', price: 89.99, stock: 20, status: 'pending', image: 'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&q=80&w=200' },
];


export default function VendorProductsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [search, setSearch] = useState('');

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: 'Active', bg: colors.successGhost, text: colors.success },
    out_of_stock: { label: 'Out of Stock', bg: colors.errorGhost, text: colors.error },
    pending: { label: 'Pending Review', bg: colors.warningGhost, text: colors.warning },
  };

  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>My Products</Text>
        <Pressable onPress={() => router.push('/vendor-dashboard/add-product' as any)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 }}>
          <Ionicons name="add" size={18} color={colors.surface} style={{ marginRight: 4 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.surface }}>Add</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.surfaceMuted, height: 48 }}>
          <Ionicons name="search" size={18} color={colors.inkGhost} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor={colors.inkGhost}
            style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}>
        {filtered.map(product => {
          const cfg = STATUS_CFG[product.status];
          return (
            <Pressable
              key={product.id}
              onPress={() => router.push('/vendor-dashboard/add-product' as any)}
              style={{ backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceMuted }}
            >
              <Image source={{ uri: product.image }} style={{ width: 88, height: 88 }} resizeMode="cover" />
              <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }} numberOfLines={2}>{product.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>${product.price}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: product.stock === 0 ? colors.error : colors.inkGhost }}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: cfg.text }}>{cfg.label}</Text>
                    </View>
                    <Pressable style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="create-outline" size={17} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
