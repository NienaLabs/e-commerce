import React, { useState, useContext } from 'react';
import { View, Text, Pressable, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getVendorMe, getVendorProducts } from '../../api/vendors';
import { AuthContext } from '../../context/AuthContext';
import { Header, ScreenBody, Card, Badge, EmptyState, Btn, Skeleton, font } from '../../components/vendor/kit';

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

export default function VendorProductsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const { token } = useContext(AuthContext);

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

  const statusFor = (p: any) => {
    if (p.stock_quantity === 0) return { label: 'Out of stock', tone: 'error' as const };
    if (!p.is_active) return { label: 'In review', tone: 'warning' as const };
    return { label: 'Active', tone: 'success' as const };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      <Header
        title="My products"
        subtitle={`${products.length} item${products.length === 1 ? '' : 's'} in your catalog`}
        onBack={() => router.push('/vendor-dashboard' as any)}
        right={<Btn title="Add" icon="add" small onPress={() => router.push('/vendor-dashboard/add-product' as any)} />}
      />

      {/* Search bar */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
        <View style={{ width: '100%', maxWidth: 1200, alignSelf: 'center' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            height: 48, borderRadius: 24, paddingHorizontal: 16,
            backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
          }}>
            <Ionicons name="search" size={18} color={colors.inkMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your products…"
              placeholderTextColor={colors.inkGhost}
              style={{ flex: 1, fontFamily: font.body, fontSize: 14.5, color: colors.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScreenBody contentStyle={{ paddingTop: 12 }}>
        {isLoading ? (
          [0, 1, 2, 3].map(i => (
            <Card key={i} padded={false} style={{ flexDirection: 'row', overflow: 'hidden' }}>
              <Skeleton width={92} height={92} radius={0} />
              <View style={{ flex: 1, padding: 14, gap: 10 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={14} />
              </View>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 24 }}>
            <EmptyState
              icon={search ? 'search-outline' : 'cube-outline'}
              title={search ? 'No matching products' : 'No products yet'}
              body={search ? 'Try a different search term.' : 'Add your first product to start selling. It only takes a minute to list one.'}
              cta={search ? undefined : { label: 'Add your first product', onPress: () => router.push('/vendor-dashboard/add-product' as any), icon: 'add' }}
            />
          </View>
        ) : (
          filtered.map(product => {
            const st = statusFor(product);
            const primaryImage = product.images?.find(img => img.is_primary);
            const firstImage = (primaryImage ?? product.images?.[0])?.image_url
              ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200';
            return (
              <Card
                key={product.id}
                padded={false}
                onPress={() => router.push({ pathname: '/vendor-dashboard/add-product', params: { id: product.id } } as any)}
                style={{ flexDirection: 'row', overflow: 'hidden' }}
              >
                <Image source={{ uri: firstImage }} style={{ width: 92, height: 92, backgroundColor: colors.surfaceSoft }} resizeMode="cover" />
                <View style={{ flex: 1, padding: 14, justifyContent: 'space-between', minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{ flex: 1, fontFamily: font.h3, fontSize: 14.5, color: colors.ink }} numberOfLines={2}>{product.name}</Text>
                    <Badge label={st.label} tone={st.tone} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                    <View style={{ minWidth: 0, flex: 1 }}>
                      <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.ink }}>{money(product.actual_price)}</Text>
                      <Text style={{ fontFamily: font.body, fontSize: 12, color: product.stock_quantity === 0 ? colors.error : colors.inkMuted, marginTop: 1 }}>
                        {product.stock_quantity === 0 ? 'Out of stock' : `${product.stock_quantity} in stock`}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: font.labelM, fontSize: 12.5, color: colors.inkMuted }}>Edit</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.inkGhost} />
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScreenBody>
    </SafeAreaView>
  );
}
