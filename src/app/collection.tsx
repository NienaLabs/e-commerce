/**
 * Full listing behind every "See all" on the home screen.
 *
 * Those links were dead — the Pressable in RecommendationShelf had no onPress
 * at all, so tapping through to a whole category was impossible. This is the
 * destination.
 *
 * Two kinds of shelf arrive here:
 *   • a category row  → ?categoryId=… , paginated straight from /products
 *   • a recommendation row → ?slot=… , one larger pull of that shelf
 * Only the category case can meaningfully paginate; a recommendation shelf is
 * a finite ranked set, so it loads once.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { listProducts, getProduct, mapProductToCard, Product } from '../api/products';
import { getRecommendationShelf, MAX_SHELF_LIMIT } from '../api/recommendations';

const PAGE_SIZE = 20;

type Card = ReturnType<typeof mapProductToCard>;

export default function CollectionScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    label?: string;
    categoryId?: string;
    slot?: string;
  }>();

  const label = params.label || 'Products';
  const categoryId = params.categoryId;
  const slot = params.slot;
  const paginated = Boolean(categoryId);

  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two columns on a phone, more as the window grows on web.
  const columns = width >= 1100 ? 4 : width >= 760 ? 3 : 2;
  const gutter = 12;
  const horizontalPadding = 16;
  const cardWidth =
    (Math.min(width, 1280) - horizontalPadding * 2 - gutter * (columns - 1)) / columns;

  const load = useCallback(
    async (mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'more' && (exhausted || loadingMore)) return;

      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);

      try {
        if (categoryId) {
          const skip = mode === 'more' ? items.length : 0;
          const page = await listProducts({
            category_id: categoryId,
            skip,
            limit: PAGE_SIZE,
          });
          const mapped = page.map(mapProductToCard);
          setItems(prev => (mode === 'more' ? [...prev, ...mapped] : mapped));
          if (mapped.length < PAGE_SIZE) setExhausted(true);
        } else if (slot && token) {
          // MAX_SHELF_LIMIT, not more: the endpoint caps at 50 and answers 422
          // for anything larger, which was failing every recommendation shelf.
          const shelf = await getRecommendationShelf(token, slot, MAX_SHELF_LIMIT);
          // The /shelf/{slot} endpoint returns ranked product IDs plus metadata
          // only — no name, price, or image. The home screen hydrates these
          // against its own product feed; this screen has no such feed, so the
          // cards rendered blank (an empty "See all"). Fetch each product to
          // fill them in, preserving the server's ranking order and dropping any
          // that 404 (e.g. a product deleted since the shelf was built).
          const ids = (shelf.products ?? []).map(p => p.product_id);
          const settled = await Promise.allSettled(ids.map(id => getProduct(id)));
          setItems(
            settled
              .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
              .map(r => mapProductToCard(r.value)) as Card[]
          );
          setExhausted(true);
        } else {
          // A recommendation shelf with no session to personalise against.
          setItems([]);
          setExhausted(true);
        }
      } catch (e: any) {
        // Say what actually went wrong — a generic message here cost real time
        // diagnosing a 422 that looked identical to being offline.
        const status = e?.status ? ` (${e.status})` : '';
        setError(
          `Couldn't load these products${status}. Pull down to try again.`
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [categoryId, slot, token, items.length, exhausted, loadingMore]
  );

  useEffect(() => {
    load('initial');
    // Only re-run when the collection itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, slot]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceMuted,
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
          hitSlop={8}
          style={{ marginRight: 12, padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'Inter_700Bold', fontSize: 19, color: colors.ink }}
          >
            {label}
          </Text>
          {!loading && items.length > 0 && (
            <Text
              style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}
            >
              {items.length}
              {paginated && !exhausted ? '+' : ''} item{items.length === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryDim} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          numColumns={columns}
          // FlatList needs a fresh identity when the column count changes.
          key={`cols-${columns}`}
          contentContainerStyle={{
            padding: horizontalPadding,
            paddingBottom: 40,
            alignSelf: 'center',
            width: '100%',
            maxWidth: 1280,
          }}
          columnWrapperStyle={columns > 1 ? { gap: gutter, marginBottom: gutter } : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => paginated && load('more')}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
              <Ionicons
                name={error ? 'cloud-offline-outline' : 'cube-outline'}
                size={44}
                color={colors.inkGhost}
              />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 16,
                  color: colors.ink,
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                {error ? 'Something went wrong' : 'Nothing here yet'}
              </Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 13,
                  color: colors.inkMuted,
                  marginTop: 6,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {error ?? 'There are no products in this collection right now.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 24 }}>
                <ActivityIndicator color={colors.primaryDim} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ProductCard
                {...item}
                onPress={() => router.push(`/product/${item.id}` as any)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
