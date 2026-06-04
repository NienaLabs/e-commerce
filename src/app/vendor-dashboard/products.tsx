import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, useWindowDimensions, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorMe, getVendorProducts } from '../../api/vendors';
import { AuthContext } from '../../context/AuthContext';

export default function VendorProductsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [search, setSearch] = useState('');
  const { token } = useContext(AuthContext);

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: 'Active', bg: colors.successGhost, text: colors.success },
    out_of_stock: { label: 'Out of Stock', bg: colors.errorGhost, text: colors.error },
    pending: { label: 'Pending Review', bg: colors.warningGhost, text: colors.warning },
  };

  const { data: vendor } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => getVendorMe(token!),
    enabled: !!token,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['vendor-products', vendor?.id],
    queryFn: () => getVendorProducts(vendor!.id),
    enabled: !!vendor?.id,
  });

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="cube-outline" size={64} color={colors.surfaceMuted} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkGhost, marginTop: 12 }}>
              {search ? 'No products match your search.' : 'You have no products yet.'}
            </Text>
          </View>
        ) : (
          filtered.map(product => {
            const statusKey = product.stock_quantity === 0 ? 'out_of_stock' : (product.is_active ? 'active' : 'pending');
            const cfg = STATUS_CFG[statusKey];
            const firstImage = product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200';
            
            return (
              <Pressable
                key={product.id}
                onPress={() => router.push('/vendor-dashboard/add-product' as any)} // TODO: Change to edit product when ready
                style={{ backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceMuted }}
              >
                <Image source={{ uri: firstImage }} style={{ width: 88, height: 88 }} resizeMode="cover" />
                <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }} numberOfLines={2}>{product.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>${product.actual_price.toFixed(2)}</Text>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: product.stock_quantity === 0 ? colors.error : colors.inkGhost }}>
                        {product.stock_quantity === 0 ? 'Out of stock' : `${product.stock_quantity} in stock`}
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
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
