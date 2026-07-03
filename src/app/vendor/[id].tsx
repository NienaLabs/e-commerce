import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../../components/ProductCard';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendor, getVendorProducts, getVendorFollowStatus, toggleVendorFollow } from '../../api/vendors';
import { mapProductToCard } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import { ToastAndroid } from 'react-native';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200';

const StatBox = ({ value, label, colors }: { value: string; label: string; colors: any }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>{value}</Text>
    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{label}</Text>
  </View>
);

export default function VendorStorefront() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = Array.isArray(id) ? id[0] : id as string;
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const { data: vendor, isLoading: vendorLoading, isError: vendorError } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: !!vendorId,
  });

  const { data: followStatus, isLoading: followLoading } = useQuery({
    queryKey: ['vendor-follow-status', vendorId],
    queryFn: () => getVendorFollowStatus(token!, vendorId),
    enabled: !!vendorId && !!token,
  });

  const following = followStatus?.following ?? false;

  const followMutation = useMutation({
    mutationFn: () => toggleVendorFollow(token!, vendorId),
    onMutate: async () => {
      // Optimistic update for follow status
      await queryClient.cancelQueries({ queryKey: ['vendor-follow-status', vendorId] });
      await queryClient.cancelQueries({ queryKey: ['vendor', vendorId] });
      
      const prevFollow = queryClient.getQueryData<{ following: boolean }>(['vendor-follow-status', vendorId]);
      const prevVendor = queryClient.getQueryData<any>(['vendor', vendorId]);
      
      const isCurrentlyFollowing = prevFollow?.following ?? false;
      
      queryClient.setQueryData(['vendor-follow-status', vendorId], { following: !isCurrentlyFollowing });
      
      if (prevVendor) {
        queryClient.setQueryData(['vendor', vendorId], {
          ...prevVendor,
          followers: Math.max(0, (prevVendor.followers || 0) + (isCurrentlyFollowing ? -1 : 1))
        });
      }
      
      return { prevFollow, prevVendor };
    },
    onError: (_err, _vars, context: any) => {
      queryClient.setQueryData(['vendor-follow-status', vendorId], context.prevFollow);
      if (context.prevVendor) {
        queryClient.setQueryData(['vendor', vendorId], context.prevVendor);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-follow-status', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
    },
  });

  const { data: rawProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => getVendorProducts(vendorId, { limit: 50 }),
    enabled: !!vendorId,
  });

  const productList = rawProducts.map(mapProductToCard);

  if (vendorLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>Loading store...</Text>
      </SafeAreaView>
    );
  }

  if (vendorError || !vendor) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32 }} edges={['top']}>
        <Ionicons name="storefront-outline" size={64} color={colors.inkGhost} />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginTop: 16, marginBottom: 8 }}>Store not found</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>
          This vendor may have been removed or doesn&apos;t exist.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ink, borderRadius: 24 }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', color: colors.surface }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const joinedYear = new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isOwnStore = user?.id === vendor.user_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Back Button (absolute over banner) */}
      <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 56 : 16, left: 16, zIndex: 20 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: pressed ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ─── Banner ─── */}
        <View style={{ height: 200, width: '100%', backgroundColor: colors.surfaceMuted }}>
          <Image
            source={{ uri: vendor.banner_url ?? FALLBACK_BANNER }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }} />
        </View>

        {/* ─── Profile Section ─── */}
        <View style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 24,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colors.isDark ? 0.3 : 0.05,
          shadowRadius: 24,
          elevation: 4,
        }}>
          {/* Avatar + Action Buttons Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36 }}>
            {/* Avatar */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              borderWidth: 3, borderColor: colors.surface,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6,
            }}>
              <Image source={{ uri: vendor.logo_url ?? FALLBACK_AVATAR }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              {!isOwnStore && (
                <>
                  {/* Message Button */}
                  <Pressable
                    onPress={() => {
                      if (!token) {
                        if (Platform.OS === 'web') alert('Please log in to message this vendor');
                        else ToastAndroid.show('Please log in to message this vendor', ToastAndroid.SHORT);
                        router.push('/(auth)/login');
                        return;
                      }
                      router.push(`/chat/${vendor.id}` as any);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 18,
                      paddingVertical: 11,
                      borderRadius: 24,
                      backgroundColor: colors.surfaceSoft,
                      borderWidth: 1.5,
                      borderColor: colors.surfaceMuted,
                      opacity: pressed ? 0.85 : 1,
                      marginRight: 10,
                    })}
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color={colors.inkMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted }}>Message</Text>
                  </Pressable>

                  {/* Follow Button */}
                  <Pressable
                    onPress={() => {
                      if (!token) {
                        if (Platform.OS === 'web') alert('Please log in to follow this store');
                        else ToastAndroid.show('Please log in to follow this store', ToastAndroid.SHORT);
                        router.push('/(auth)/login');
                        return;
                      }
                      followMutation.mutate();
                    }}
                    disabled={(!!token && followLoading) || followMutation.isPending}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 22,
                      paddingVertical: 11,
                      borderRadius: 24,
                      backgroundColor: following ? colors.surfaceSoft : colors.ink,
                      borderWidth: following ? 1.5 : 0,
                      borderColor: colors.surfaceMuted,
                      opacity: pressed || (!!token && followLoading) || followMutation.isPending ? 0.7 : 1,
                    })}
                  >
                    <Ionicons
                      name={following ? 'checkmark' : 'add'}
                      size={16}
                      color={following ? colors.inkMuted : colors.surface}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: following ? colors.inkMuted : colors.surface }}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Name + Slug */}
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, marginRight: 8 }}>
                {vendor.store_name}
              </Text>
              {vendor.is_verified && (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: colors.info,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 2 }}>
              @{vendor.store_slug}
            </Text>
          </View>

          {/* Bio */}
          {vendor.bio ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 22, marginBottom: 16 }}>
              {vendor.bio}
            </Text>
          ) : null}

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceSoft,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 8,
            marginBottom: 14,
          }}>
            <StatBox value={String(vendor.products)} label="Products" colors={colors} />
            <View style={{ width: 1, backgroundColor: colors.surfaceMuted }} />
            <StatBox value={formatNumber(vendor.followers || 0)} label="Followers" colors={colors} />
          </View>

          {/* Joined date */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={14} color={colors.inkGhost} style={{ marginRight: 5 }} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>
              Member since {joinedYear}
            </Text>
          </View>
        </View>

        {/* ─── Products Grid ─── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, letterSpacing: -0.3 }}>
              All Products
            </Text>
            {!productsLoading && (
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost }}>
                {productList.length} items
              </Text>
            )}
          </View>

          {productsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>
                Loading products...
              </Text>
            </View>
          ) : productList.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="cube-outline" size={64} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.inkGhost }}>
                No products yet
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {productList.map(product => (
                <View
                  key={product.id}
                  style={{ width: isDesktop ? '48%' : '100%' }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    salePrice={product.salePrice}
                    imageUrl={product.imageUrl}
                    vendorId={product.vendorId}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
