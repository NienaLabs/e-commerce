import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RecommendationCard, RecommendationCardSkeleton } from './RecommendationCard';
import { SHELF_META, EXPANDABLE_SHELF_SLOTS } from '../api/recommendations';
import { router } from 'expo-router';

interface ShelfProduct {
  product_id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  reason_label: string;
  has_discount: boolean;
  /** Omit only when the caller genuinely has no stock data. */
  inStock?: boolean;
}

interface RecommendationShelfProps {
  slot: string;
  label: string;
  products: ShelfProduct[];
  isLoading?: boolean;
  /** Set on category rows so "See all" can page through that category. */
  categoryId?: string;
}

export const RecommendationShelfRow = ({
  slot,
  label,
  products,
  isLoading,
  categoryId,
}: RecommendationShelfProps) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const canExpand = Boolean(categoryId) || EXPANDABLE_SHELF_SLOTS.has(slot);

  let meta = SHELF_META[slot];
  if (!meta) {
    let defaultIcon = 'sparkles';
    if (slot === 'category') {
      const labelLower = label.toLowerCase();
      if (labelLower.includes('electronic')) defaultIcon = 'hardware-chip';
      else if (labelLower.includes('fashion') || labelLower.includes('cloth') || labelLower.includes('apparel')) defaultIcon = 'shirt';
      else if (labelLower.includes('home')) defaultIcon = 'home';
      else if (labelLower.includes('beauty') || labelLower.includes('health') || labelLower.includes('accessor')) defaultIcon = 'color-palette';
      else if (labelLower.includes('sport')) defaultIcon = 'football';
      else if (labelLower.includes('food') || labelLower.includes('grocer')) defaultIcon = 'restaurant';
      else if (labelLower.includes('game') || labelLower.includes('gaming') || labelLower.includes('toy')) defaultIcon = 'game-controller';
      else if (labelLower.includes('book')) defaultIcon = 'book';
      else if (labelLower.includes('auto')) defaultIcon = 'car';
      else defaultIcon = 'pricetags';
    }
    meta = {
      icon: defaultIcon,
      gradient: [colors.primary, colors.primaryDim],
    };
  }

  if (!isLoading && products.length === 0) return null;

  return (
    <View style={{ paddingTop: 28 }}>
      {/* ── Section Header ── */}
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {/* Icon badge */}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              overflow: 'hidden',
              marginRight: 10,
              backgroundColor: meta.gradient[0],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={meta.icon as any}
              size={18}
              color="#ffffff"
            />
          </View>

          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: isDesktop ? 20 : 18,
              color: colors.ink,
              letterSpacing: -0.3,
              flex: 1,
            }}
          >
            {label}
          </Text>
        </View>

        {/* Only offered when there is somewhere real to go: a category we can
            page through, or a slot the recommender will actually serve.
            `price_drop` is composed on the home screen and 404s if asked for. */}
        {canExpand && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/collection',
              // A category row can be paginated by id; a recommendation row is
              // fetched by its slot instead.
              params: categoryId ? { label, categoryId } : { label, slot },
            } as any)
          }
          accessibilityRole="button"
          accessibilityLabel={`See all ${label}`}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
            paddingLeft: 12,
            paddingVertical: 6,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: colors.inkMuted,
              marginRight: 2,
            }}
          >
            See all
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
        </Pressable>
        )}
      </View>

      {/* ── Horizontal Scroll ── */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 24,
            paddingRight: 12,
            gap: 12,
            paddingBottom: 4,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 24,
            paddingRight: 12,
            gap: 12,
            paddingBottom: 4,
          }}
          decelerationRate="fast"
        >
          {products.map((product) => (
            <RecommendationCard
              key={product.product_id}
              id={product.product_id}
              name={product.name}
              price={product.price}
              salePrice={product.salePrice}
              imageUrl={product.imageUrl}
              vendorId={product.vendorId}
              vendorName={product.vendorName}
              vendorAvatar={product.vendorAvatar}
              reasonLabel={product.reason_label}
              hasDiscount={product.has_discount}
              inStock={product.inStock}
              onPress={() =>
                router.push(`/product/${product.product_id}` as any)
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
