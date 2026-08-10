import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../../components/ProductCard';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendor, getVendorProducts, getVendorFollowStatus, toggleVendorFollow } from '../../api/vendors';
import { canMessageVendor } from '../../api/chat';
import { mapProductToCard } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import { ToastAndroid } from 'react-native';
import { setFollowState } from '../../api/localFollows';
import { VendorAvatar } from '../../components/VendorAvatar';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200';

/** Widest the storefront ever gets on a large monitor — beyond this it centres. */
const MAX_CONTENT_WIDTH = 1200;

/**
 * Layout that adapts to the actual viewport rather than a single web-only
 * `isDesktop` flag. Phones get a real two-column product grid (one column only
 * on very narrow devices, where two cards would be unreadable), tablets three,
 * wide desktops four.
 */
function useStorefrontLayout() {
  const { width } = useWindowDimensions();

  const gutter = width < 400 ? 16 : width < 768 ? 20 : 24;
  const gap = width < 400 ? 12 : width < 768 ? 14 : 20;

  const columns =
    width >= 1280 ? 4 :
    width >= 1024 ? 3 :
    width >= 700 ? 3 :
    width >= 360 ? 2 :
    1;

  // Compute the card width in points instead of percentages: percentages plus a
  // flex gap overflow by a fraction of a pixel per column, which is what makes
  // the right-hand card clip on a narrow screen.
  const frameWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const contentWidth = frameWidth - gutter * 2;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  return {
    width,
    gutter,
    gap,
    columns,
    cardWidth,
    contentWidth,
    isCompact: width < 768,
    isNarrow: width < 400,
    bannerHeight: width < 400 ? 150 : width < 768 ? 180 : 240,
    avatarSize: width < 400 ? 68 : 84,
  };
}

const StatBox = ({ value, label, colors }: { value: string; label: string; colors: any }) => (
  <View style={{ alignItems: 'center', flex: 1, minWidth: 0, paddingHorizontal: 4 }}>
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}
    >
      {value}
    </Text>
    <Text
      numberOfLines={1}
      style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}
    >
      {label}
    </Text>
  </View>
);

export default function VendorStorefront() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = Array.isArray(id) ? id[0] : id as string;
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const {
    gutter, gap, cardWidth, isCompact, isNarrow, bannerHeight, avatarSize,
  } = useStorefrontLayout();

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

  // Messaging is gated on having ordered from this vendor.
  const { data: canMsg } = useQuery({
    queryKey: ['can-message-vendor', vendorId],
    queryFn: () => canMessageVendor(vendorId, token!),
    enabled: !!vendorId && !!token,
  });

  useEffect(() => {
    if (followStatus) {
      setFollowState(vendorId, followStatus.following);
    }
  }, [followStatus, vendorId]);

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
    onSuccess: (data, _vars, context: any) => {
      // Apply the authoritative response directly to the cache
      queryClient.setQueryData(['vendor-follow-status', vendorId], data);
      
      // Keep local AsyncStorage in sync
      setFollowState(vendorId, data.following);
      
      if (context?.prevVendor) {
        const wasFollowing = context.prevFollow?.following ?? false;
        const isNowFollowing = data.following;
        if (wasFollowing !== isNowFollowing) {
          const diff = isNowFollowing ? 1 : -1;
          queryClient.setQueryData(['vendor', vendorId], {
            ...context.prevVendor,
            followers: Math.max(0, (context.prevVendor.followers || 0) + diff)
          });
        } else {
          queryClient.setQueryData(['vendor', vendorId], context.prevVendor);
        }
      }
    },
    onError: (_err, _vars, context: any) => {
      queryClient.setQueryData(['vendor-follow-status', vendorId], context.prevFollow);
      if (context.prevVendor) {
        queryClient.setQueryData(['vendor', vendorId], context.prevVendor);
      }
      ToastAndroid.show('Failed to update follow status', ToastAndroid.SHORT);
    },
    onSettled: () => {
      // Still invalidate the main vendor profile to get fresh stats (followers count)
      // but the follow-status is already correctly synced by onSuccess
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
    const isDefinitelyNoProfile = (vendorError as any)?.status === 404;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32 }} edges={['top']}>
        <Ionicons name="storefront-outline" size={64} color={colors.inkGhost} />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginTop: 16, marginBottom: 8 }}>
          {isDefinitelyNoProfile ? 'Store not found' : 'Connection failed'}
        </Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>
          {isDefinitelyNoProfile 
            ? "This vendor may have been removed or doesn't exist." 
            : "We couldn't connect to the server. Please check your internet connection and try again."}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted, borderRadius: 24 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', color: colors.ink }}>Go Back</Text>
          </Pressable>
          <Pressable
            onPress={() => queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] })}
            style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ink, borderRadius: 24 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', color: colors.surface }}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const joinedYear = new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isOwnStore = user?.id === vendor.user_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Back Button (absolute over banner) — anchored to the real safe area
          rather than a hardcoded per-OS offset, so it clears every notch. */}
      <View style={{ position: 'absolute', top: insets.top + 12, left: gutter, zIndex: 20 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Centres the storefront on wide monitors instead of stretching it. */}
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>

        {/* ─── Banner ─── */}
        <View style={{ height: bannerHeight, width: '100%', backgroundColor: colors.surfaceMuted }}>
          <Image
            source={vendor.banner_url ?? FALLBACK_BANNER}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            priority="high"
          />
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }} />
        </View>

        {/* ─── Profile Section ─── */}
        <View style={{
          backgroundColor: colors.surface,
          paddingHorizontal: gutter,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colors.isDark ? 0.3 : 0.05,
          shadowRadius: 24,
          elevation: 4,
        }}>
          {/* Avatar + Action Buttons.
              On phones the avatar and the two pill buttons together are wider
              than the screen, so the actions drop onto their own full-width row
              instead of being squeezed off the edge. */}
          <View
            style={{
              flexDirection: isCompact ? 'column' : 'row',
              alignItems: isCompact ? 'stretch' : 'flex-end',
              justifyContent: 'space-between',
              marginTop: -(avatarSize / 2),
              gap: isCompact ? 14 : 0,
            }}
          >
            {/* Avatar */}
            <View style={{
              width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
              borderWidth: 3, borderColor: colors.surface,
              overflow: 'hidden',
              flexShrink: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6,
            }}>
              <VendorAvatar uri={vendor.logo_url} size={avatarSize} radius={avatarSize / 2} />
            </View>

            {!isOwnStore && (
              <View style={{
                flexDirection: 'row',
                justifyContent: isCompact ? 'space-between' : 'flex-end',
                alignItems: 'center',
                gap: 10,
              }}>
                {/* Message Button */}
                <Pressable
                  onPress={() => {
                    if (!token) {
                      if (Platform.OS === 'web') alert('Please log in to message this vendor');
                      else ToastAndroid.show('Please log in to message this vendor', ToastAndroid.SHORT);
                      router.push('/(auth)/login');
                      return;
                    }
                    // Order gate: only customers who have ordered from this vendor may message.
                    if (canMsg && !canMsg.allowed) {
                      const msg = 'You can message this vendor after placing an order with them.';
                      if (Platform.OS === 'web') alert(msg);
                      else ToastAndroid.show(msg, ToastAndroid.SHORT);
                      return;
                    }
                    router.push(`/chat/${vendor.id}?vendorName=${encodeURIComponent(vendor.store_name ?? 'Vendor Store')}` as any);
                  }}
                  style={({ pressed }) => ({
                    flex: isCompact ? 1 : undefined,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: isNarrow ? 12 : 18,
                    minHeight: 44,
                    borderRadius: 24,
                    backgroundColor: colors.surfaceSoft,
                    borderWidth: 1.5,
                    borderColor: colors.surfaceMuted,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color={colors.inkMuted} style={{ marginRight: 6 }} />
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted }}>Message</Text>
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
                    flex: isCompact ? 1 : undefined,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: isNarrow ? 12 : 22,
                    minHeight: 44,
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
                  <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: following ? colors.inkMuted : colors.surface }}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Name + Slug */}
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* flexShrink lets a long store name truncate instead of pushing
                  the verified tick off the screen. */}
              <Text
                numberOfLines={2}
                style={{ flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 19 : 22, color: colors.ink }}
              >
                {vendor.store_name}
              </Text>
              {vendor.is_verified && (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: colors.info,
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 2 }}>
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
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>
              Member since {joinedYear}
            </Text>
          </View>
        </View>

        {/* ─── Products Grid ─── */}
        <View style={{ paddingHorizontal: gutter, paddingTop: isCompact ? 24 : 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <Text
              numberOfLines={1}
              style={{ flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: isNarrow ? 18 : 20, color: colors.ink, letterSpacing: -0.3 }}
            >
              All Products
            </Text>
            {!productsLoading && (
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, flexShrink: 0 }}>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {productList.map(product => (
                <View key={product.id} style={{ width: cardWidth }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    salePrice={product.salePrice}
                    imageUrl={product.imageUrl}
                    vendorId={product.vendorId}
                    inStock={product.inStock}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
