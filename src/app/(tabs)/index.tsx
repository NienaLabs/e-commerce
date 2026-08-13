import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SEO } from '@/components/SEO';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { PromoCard } from '@/components/PromoCard';
import { Skeleton } from '@/components/Skeleton';
import { FilterModal } from '@/components/FilterModal';
import { LocationSearchModal, LocationResult } from '@/components/LocationSearchModal';
import { RecommendationShelfRow } from '@/components/RecommendationShelf';
import { VendorShelf } from '@/components/VendorShelf';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listProducts, mapProductToCard, Product, getGroupedProducts, getHeroBanners } from '../../api/products';
import { getRecommendations, RecommendationResponse } from '../../api/recommendations';
import { listCategories } from '../../api/categories';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import HeroBanner from '@/components/HeroBanner';
import { useSidebar } from '../../context/SidebarContext';
import { useLocationStore } from '../../store/locationStore';
import { resolveCategory, iconForSchemaKey } from '../../utils/categoryIcons';


// Icons come from the shared map so this list, the live-category matcher below,
// and the all-categories screen can't drift apart again. Ids double as filter
// schema keys; anything without art yet renders a neutral placeholder.
const CATEGORIES = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home & Living' },
  { id: 'phones', label: 'Mobile Phones' },
  { id: 'computers', label: 'Computers & Tablets' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'beauty', label: 'Accessories' },
  { id: 'health_beauty', label: 'Health & Beauty' },
  { id: 'sports', label: 'Sports' },
  { id: 'outdoor', label: 'Outdoors' },
  { id: 'home_appliances', label: 'Home Appliances' },
  { id: 'food', label: 'Food' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'toys', label: 'Toys & Hobbies' },
  { id: 'books', label: 'Books' },
  { id: 'art_crafts', label: 'Art & Crafts' },
  { id: 'pet_supplies', label: 'Pet Supplies' },
].map(c => ({ ...c, image: iconForSchemaKey(c.id) }));

// Every option here is backed by a field the API actually returns, so picking
// one always changes the list. The previous lists promised things the data
// couldn't deliver — "Buy 1 Get 1", "Members Only", and a hardcoded brand list
// (Sony/Apple/Nike…) with no brand field on a product anywhere.
const SORT_RECOMMENDED = 'Recommended';
const SORT_DISCOUNT = 'Biggest Discount';

const BASE_SORT_OPTIONS = [
  SORT_RECOMMENDED,
  'Price: Low to High',
  'Price: High to Low',
  'Newest Arrivals',
  'Top Rated',
  'Most Popular',
];

const PRODUCTS_PAGE_SIZE = 20;

// The filter sheet speaks its own vocabulary; map it onto the chip sort so the
// two controls can't disagree about how the list is ordered.
const MODAL_SORT_TO_LABEL: Record<string, string> = {
  recommended: SORT_RECOMMENDED,
  newest: 'Newest Arrivals',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  rating: 'Top Rated',
  bestsellers: 'Most Popular',
};

const OFFER_ALL = 'All Products';
const OFFER_OPTIONS = [OFFER_ALL, 'Discounted Only'];

const RATING_ANY = 'Any Rating';
const RATING_OPTIONS = [RATING_ANY, '4.5 Stars & Up', '4 Stars & Up', '3 Stars & Up', '2 Stars & Up'];

/** Price a shopper actually pays — used for both sorting and discount maths. */
const effectivePrice = (p: any) => p.discount_price ?? p.actual_price;

const discountPct = (p: any) =>
  p.discount_price && p.actual_price > 0
    ? (p.actual_price - p.discount_price) / p.actual_price
    : 0;

type DropdownKey = 'Sort' | 'Offers' | 'Ratings' | null;

export default function Home() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const { toggle } = useSidebar();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [sortBy, setSortBy] = useState<string>(SORT_RECOMMENDED);
  const [offerFilter, setOfferFilter] = useState<string>(OFFER_ALL);
  const [ratingFilter, setRatingFilter] = useState<string>(RATING_ANY);
  // Price band + availability chosen in the filter sheet. Its onApply used to
  // be an empty TODO, so every selection in that sheet was discarded on Apply.
  const [priceBand, setPriceBand] = useState<[number, number] | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const { unreadCount, pushPermissionStatus, requestPushPermission } = useNotifications();

  // Location tracking
  const { city: locationName, status: locationStatus, startTracking } = useLocationStore();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const topRowHeight = isDesktop ? 52 : 74;

  const headerTopRowStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 80], [topRowHeight, 0], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP);
    const transform = [{ translateY: interpolate(scrollY.value, [0, 80], [0, -10], Extrapolation.CLAMP) }];
    return { height, opacity, transform, overflow: 'hidden' };
  });

  const headerStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, 80],
      [0, colors.isDark ? 0.6 : 0.15],
      Extrapolation.CLAMP
    );
    const elevation = interpolate(scrollY.value, [0, 80], [0, 8], Extrapolation.CLAMP);
    const backgroundColor = interpolateColor(
      scrollY.value,
      [40, 80],
      ['transparent', colors.surface]
    );
    return { shadowOpacity, elevation, backgroundColor };
  });

  const searchBarStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [40, 80],
      [
        colors.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
        colors.isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceSoft || '#f3f4f6'
      ]
    );

    const borderColor = interpolateColor(
      scrollY.value,
      [40, 80],
      [
        colors.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
        colors.isDark ? 'rgba(255,255,255,0.2)' : colors.surfaceMuted || '#e5e7eb'
      ]
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: 1.5,
      borderRadius: 26,
    };
  });

  // Paged products. The old call fetched a fixed 20 and never sent
  // category_id, so the category sat in the query key while every category
  // refetched the same first 20 rows and filtered them on the client — a
  // category whose products fell outside that window looked empty.
  const {
    data: productPages,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', selectedCategory],
    queryFn: ({ pageParam }) =>
      listProducts({
        skip: pageParam,
        limit: PRODUCTS_PAGE_SIZE,
        category_id: selectedCategory ?? undefined,
      }),
    initialPageParam: 0,
    // A short page means the server has nothing left to give.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PRODUCTS_PAGE_SIZE ? undefined : allPages.length * PRODUCTS_PAGE_SIZE,
  });

  const products = useMemo(() => productPages?.pages.flat() ?? [], [productPages]);

  // Fetch grouped products for category shelves.
  //
  // This screen fires seven requests on mount, and with the global 60s
  // staleTime every one of them re-fired on each window focus. The shelves are
  // an editorial "what's popular" view, not a live stock readout — the cart
  // re-checks stock against the server before checkout — so a couple of
  // minutes of cache here costs nothing and takes the biggest payload on the
  // screen out of the refetch storm.
  const { data: groupedCategories = [], isLoading: groupedLoading } = useQuery({
    queryKey: ['groupedProducts', token],
    queryFn: () => getGroupedProducts(15, 5, token),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recommendation shelves (only if authenticated)
  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', token],
    queryFn: () => getRecommendations(token!, 20),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  // Fetch real categories to match user preferences. The category list is
  // effectively static — matches the staleTime discover.tsx already uses, so
  // the two screens share one cache entry instead of invalidating each other.
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(0, 50),
    staleTime: 5 * 60 * 1000,
  });

  const displayCategories = useMemo(() => {
    // The ids in CATEGORIES are already filter schema keys — passing 'default'
    // here meant the offline fallback list always got generic filters.
    if (dbCategories.length === 0) return CATEGORIES.map(c => ({ ...c, schemaKey: c.id }));

    const mapped = dbCategories.map(c => {
      // Match on slug first, then fall back to the display name — a DB slug
      // like "cat-7" carries no meaning, but its name usually does.
      const bySlug = resolveCategory(c.slug);
      const visual = bySlug.schemaKey === 'default' ? resolveCategory(c.name) : bySlug;
      return { id: c.id, label: c.name, image: visual.icon, schemaKey: visual.schemaKey };
    });

    if (user?.category_interest_ids && user.category_interest_ids.length > 0) {
      const preferred = mapped.filter(c => user.category_interest_ids!.includes(c.id));
      const others = mapped.filter(c => !user.category_interest_ids!.includes(c.id));
      return [...preferred, ...others].slice(0, 8);
    }
    return mapped.slice(0, 8);
  }, [dbCategories, user?.category_interest_ids]);

  // Fetch Flash Sales from API
  const { data: flashSales = [], isLoading: flashSalesLoading } = useQuery({
    queryKey: ['products', 'flash-sales'],
    queryFn: () => listProducts({ limit: 10, has_discount: true }),
  });

  // Fetch Hero Banners from API. Merchandising art, changed by hand — no
  // reason to re-request it every time the window regains focus.
  const { data: heroBanners = [], isLoading: heroBannersLoading } = useQuery({
    queryKey: ['heroBanners'],
    queryFn: () => getHeroBanners(),
    staleTime: 10 * 60 * 1000,
  });

  // Build a product lookup map for hydrating recommendations
  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) {
      map[p.id] = p;
    }
    return map;
  }, [products]);

  // Hydrate recommendation shelves with product details
  const hydratedShelves = useMemo(() => {
    if (!recommendations?.shelves) return [];

    return recommendations.shelves
      .map((shelf) => ({
        slot: shelf.slot,
        label: shelf.label,
        products: shelf.products
          .map((item) => {
            const product = productMap[item.product_id];
            if (!product) return null;
            const primaryImage = product.images?.find(img => img.is_primary);
            const firstImage =
              (primaryImage ?? product.images?.[0])?.image_url ??
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
            return {
              product_id: item.product_id,
              name: product.name,
              price: product.actual_price,
              salePrice: product.discount_price ?? undefined,
              imageUrl: firstImage,
              vendorId: product.vendor_id,
              vendorName: product.vendor_name ?? undefined,
              vendorAvatar: product.vendor_logo_url ?? undefined,
              reason_label: item.reason_label,
              has_discount: item.has_discount,
              inStock: product.stock_quantity > 0,
            };
          })
          .filter(Boolean) as any[],
      }))
      .filter((shelf) => shelf.products.length > 0);
  }, [recommendations, productMap]);

  // Hydrate contextual cards
  const hydratedContextualCards = useMemo(() => {
    if (!recommendations?.contextual_cards) return [];

    return recommendations.contextual_cards
      .map((item) => {
        const product = productMap[item.product_id];
        if (!product) return null;
        const primaryImage = product.images?.find(img => img.is_primary);
        const firstImage =
          (primaryImage ?? product.images?.[0])?.image_url ??
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
        return {
          product_id: item.product_id,
          name: product.name,
          price: product.actual_price,
          salePrice: product.discount_price ?? undefined,
          imageUrl: firstImage,
          vendorId: product.vendor_id,
          vendorName: product.vendor_name ?? undefined,
          vendorAvatar: product.vendor_logo_url ?? undefined,
          reason_label: item.reason_label,
          has_discount: item.has_discount,
          inStock: product.stock_quantity > 0,
        };
      })
      .filter(Boolean) as any[];
  }, [recommendations, productMap]);



  // Narrow to the chosen category first, then filter, then sort — all on the
  // raw API shape, which still carries avg_rating / created_at / view_count.
  // mapProductToCard drops those, so sorting after mapping is impossible.
  // The request is already scoped to the category, so nothing to narrow here.
  const categoryProducts = products;

  // Offer a discount sort only where there is something discounted to sort by,
  // so each category's menu reflects what's actually in it.
  const sortOptions = useMemo(() => {
    const hasDiscounts = categoryProducts.some(p => discountPct(p) > 0);
    return hasDiscounts ? [...BASE_SORT_OPTIONS, SORT_DISCOUNT] : BASE_SORT_OPTIONS;
  }, [categoryProducts]);

  // A category with no discounts can't keep a discount sort selected.
  useEffect(() => {
    if (!sortOptions.includes(sortBy)) setSortBy(SORT_RECOMMENDED);
  }, [sortOptions, sortBy]);

  const filteredProducts = useMemo(() => {
    let list = [...categoryProducts];

    if (offerFilter === 'Discounted Only') {
      list = list.filter(p => discountPct(p) > 0);
    }

    const minRating = parseFloat(ratingFilter);
    if (!Number.isNaN(minRating)) {
      list = list.filter(p => (p.avg_rating ?? 0) >= minRating);
    }

    // ── From the filter sheet ──
    if (priceBand) {
      const [min, max] = priceBand;
      list = list.filter(p => {
        const price = effectivePrice(p);
        return price >= min && price <= max;
      });
    }
    if (availability.includes('in_stock')) {
      list = list.filter(p => p.stock_quantity > 0);
    }
    if (availability.includes('on_sale')) {
      list = list.filter(p => discountPct(p) > 0);
    }

    switch (sortBy) {
      case 'Price: Low to High':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'Price: High to Low':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'Newest Arrivals':
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'Top Rated':
        list.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
        break;
      case 'Most Popular':
        list.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
        break;
      case SORT_DISCOUNT:
        list.sort((a, b) => discountPct(b) - discountPct(a));
        break;
      default:
        // Recommended = whatever order the API returned.
        break;
    }

    return list.map(mapProductToCard);
  }, [categoryProducts, offerFilter, ratingFilter, sortBy, priceBand, availability]);

  useEffect(() => {
    startTracking();
  }, [startTracking]);


  const renderDropdownChip = (
    label: DropdownKey & string,
    options: string[],
    selected: string,
    onSelect: (value: string) => void,
  ) => (
    <View key={label}>
      <Pressable
        onPress={() => setOpenDropdown(openDropdown === label ? null : label)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: openDropdown === label ? colors.ink : colors.surface,
            borderWidth: openDropdown === label ? 0 : 1,
            borderColor: colors.surfaceMuted,
            borderRadius: 20,
            paddingHorizontal: 14,
            height: 38,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: colors.isDark ? 0.3 : 0.07,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
      >
        <Text numberOfLines={1} style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          color: openDropdown === label ? colors.surface : colors.inkSoft,
          marginRight: 5,
          maxWidth: 160,
        }}>{options[0] === selected ? label : selected}</Text>
        <Ionicons
          name={openDropdown === label ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={openDropdown === label ? colors.primary : colors.inkGhost}
        />
      </Pressable>

      <Modal visible={openDropdown === label} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(34,32,34,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setOpenDropdown(null)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              width: '100%',
              maxWidth: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.18,
              shadowRadius: 60,
              elevation: 20,
              overflow: 'hidden',
            }}
            onPress={e => e.stopPropagation()}
          >
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>{label}</Text>
              <Pressable
                onPress={() => setOpenDropdown(null)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
            <View style={{ padding: 8 }}>
              {options.map((opt) => {
                // The tick used to be pinned to index 0, so it always claimed
                // the first option was active no matter what you picked.
                const isSelected = opt === selected;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => { onSelect(opt); setOpenDropdown(null); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
                    }]}
                  >
                    <Text style={{ fontFamily: isSelected ? 'Inter_600SemiBold' : 'OpenSans_400Regular', fontSize: 15, color: isSelected ? colors.ink : colors.inkSoft }}>{opt}</Text>
                    {isSelected && (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  const hasRecommendations = hydratedShelves.length > 0;
  const showRecommendationShelves = !selectedCategory && hasRecommendations;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <SEO 
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Konura",
          "url": "https://konura.store",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://konura.store/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />

      {/* ─── Header: Location + Search (Fixed & Animated) ─── */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 16,
        zIndex: 100,
      }, headerStyle]}>

        <Animated.View style={[{ marginHorizontal: -24, paddingHorizontal: 24 }, headerTopRowStyle]}>
          {/* Mobile Header */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Pressable
                  onPress={toggle}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="menu" size={24} color="#fff" />
                </Pressable>
                <Pressable onPress={() => setShowLocationSearch(true)} style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Delivering to</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff', marginRight: 4, flexShrink: 1, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={1}>
                      {locationStatus === 'loading' ? 'Detecting...' : (locationName || 'Select Location')}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                  </View>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => router.push('/notifications' as any)}
                  style={{ marginRight: 16, position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  {unreadCount > 0 && (
                    <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 4, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#fff' }}>
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  style={{
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
                    overflow: 'hidden',
                  }}
                  onPress={() => router.push('/profile')}
                >
                  {user?.image ? (
                    <Image source={{ uri: user.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>
                      {user?.name ? `${user.name.charAt(0)}${user.name.charAt(user.name.length - 1)}`.toUpperCase() : 'U'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Desktop Location Header */}
          {isDesktop && (
            <View style={{ paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setShowLocationSearch(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Ionicons name="location" size={16} color="#fff" />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', marginRight: 4, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                  Deliver to: <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', textShadowRadius: 3 }}>{locationStatus === 'loading' ? '...' : (locationName || 'Current Location')}</Text>
                </Text>
                <Ionicons name="chevron-down" size={14} color="#fff" />
              </Pressable>
            </View>
          )}

        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[{
          marginTop: isDesktop ? 0 : 0, // ensure margin is preserved
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } as any : {}),
        }, searchBarStyle]}>
          <Pressable
            onPress={() => router.push('/search')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 52,
              paddingHorizontal: 18,
            }}
          >
            <Ionicons name="search" size={20} color={colors.isDark ? '#fff' : colors.ink} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.isDark ? 'rgba(255,255,255,0.7)' : colors.inkMuted, marginLeft: 10, flex: 1 }}>
              Search products, brands...
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: Math.max(120, insets.bottom + 120)
        }}
      >

        {/* ─── Hero Banner ─── */}
        {heroBannersLoading ? (
          <View style={{ height: 350, marginHorizontal: 24, marginTop: 16 }}>
            <Skeleton width="100%" height={350} borderRadius={24} />
          </View>
        ) : (
          <HeroBanner images={heroBanners.length > 0 ? heroBanners.map((b: any) => b.image_url) : undefined} height={350} />
        )}

        {/* ─── Categories ─── */}
        <View style={{ paddingTop: 16, paddingBottom: 4 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.3 }}>
              Shop by Category
            </Text>
            <Pressable onPress={() => router.push('/categories')}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>View all</Text>
            </Pressable>
          </View>

          {isDesktop ? (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingBottom: 8,
              gap: 12,
            }}>
              {displayCategories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  label={cat.label}
                  iconSource={cat.image}
                  isActive={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  flex
                />
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16, paddingBottom: 8 }}>
              {displayCategories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  label={cat.label}
                  iconSource={cat.image}
                  isActive={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─── Vendor Shelf ─── */}
        {!selectedCategory && <VendorShelf />}

        {/* ─── Filter Row (only when category selected) ─── */}
        {selectedCategory && (
          <View style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 4,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: colors.isDark ? 0.3 : 0.08,
            shadowRadius: 10,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.surfaceMuted,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
              <Pressable
                onPress={() => setShowFilterModal(true)}
                style={({ pressed }) => [{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: pressed ? colors.inkSoft : colors.ink,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }]}
              >
                <Ionicons name="options" size={18} color={colors.surface} />
              </Pressable>

              {renderDropdownChip('Sort', sortOptions, sortBy, setSortBy)}
              {renderDropdownChip('Offers', OFFER_OPTIONS, offerFilter, setOfferFilter)}
              {renderDropdownChip('Ratings', RATING_OPTIONS, ratingFilter, setRatingFilter)}
            </ScrollView>
          </View>
        )}



        {/* ─── Recommendation Shelves (when no category filter) ─── */}
        {showRecommendationShelves && (
          <>
            {/* Contextual Cards (price drops, rising stores) */}
            {hydratedContextualCards.length > 0 && (
              <RecommendationShelfRow
                slot="price_drop"
                label="Price Drops for You"
                products={hydratedContextualCards}
              />
            )}

            {/* All recommendation shelves */}
            {hydratedShelves.map((shelf) => (
              <RecommendationShelfRow
                key={shelf.slot}
                slot={shelf.slot}
                label={shelf.label}
                products={shelf.products}
              />
            ))}
          </>
        )}

        {/* ─── Loading state for recommendations ─── */}
        {!selectedCategory && !hasRecommendations && recsLoading && (
          <View style={{ paddingTop: 32, paddingBottom: 16 }}>
            <RecommendationShelfRow
              slot="taste_profile"
              label="Curated for You"
              products={[]}
              isLoading
            />
          </View>
        )}

        {/* ─── Grouped Category Shelves (when no category filter) ─── */}
        {!selectedCategory && (
          <View style={{ paddingBottom: 24 }}>
            {groupedLoading ? (
              <View style={{ paddingVertical: 24, paddingHorizontal: 24, gap: 16 }}>
                {[1, 2].map((i) => (
                  <View key={i} style={{ marginBottom: 24 }}>
                    <Skeleton width={180} height={24} style={{ marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Skeleton width={140} height={180} borderRadius={16} />
                      <Skeleton width={140} height={180} borderRadius={16} />
                      <Skeleton width={140} height={180} borderRadius={16} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              groupedCategories.map((group) => (
                <RecommendationShelfRow
                  key={group.category_id}
                  categoryId={group.category_id}
                  slot="category"
                  label={group.category_name}
                  products={group.products.map(p => {
                    const card = mapProductToCard(p);
                    return {
                      product_id: card.id,
                      name: card.name,
                      price: card.price,
                      salePrice: card.salePrice,
                      imageUrl: card.imageUrl,
                      vendorId: card.vendorId,
                      reason_label: 'Popular in this category',
                      has_discount: !!card.salePrice,
                      inStock: card.inStock,
                    };
                  })}
                />
              ))
            )}
          </View>
        )}

        {/* ─── Product Feed (grid — only shown when category is selected) ─── */}
        {selectedCategory && (
          <View style={{ paddingTop: 24, paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.3 }}>
                {displayCategories.find(c => c.id === selectedCategory)?.label ?? 'Results'}
              </Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>
                {filteredProducts.length} items
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              {productsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={{ width: isDesktop ? '48%' : '100%' }}>
                    <ProductCardSkeleton />
                  </View>
                ))
              ) : (
                filteredProducts.map(product => (
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
                      inStock={product.inStock}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    />
                  </View>
                ))
              )}
            </View>

            {/* Pull the next page in. A button rather than onEndReached
                because this feed lives in a ScrollView, not a FlatList. */}
            {hasNextPage && filteredProducts.length > 0 && (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  alignSelf: 'center', marginTop: 24,
                  paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  opacity: pressed || isFetchingNextPage ? 0.7 : 1,
                })}
              >
                {isFetchingNextPage && <ActivityIndicator size="small" color={colors.primary} />}
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Text>
              </Pressable>
            )}

            {!productsLoading && filteredProducts.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                <Ionicons name="search-outline" size={80} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, color: colors.ink, marginBottom: 8 }}>
                  No items found
                </Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', maxWidth: 240 }}>
                  Try a different category or check back later
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* ─── Main Filter Mega-Modal ─── */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categoryId={selectedCategory ? displayCategories.find(c => c.id === selectedCategory)?.schemaKey : null}
        onApply={(filters) => {
          // Fold the sheet's selections into the same state the chips drive,
          // so both controls describe one list rather than fighting over it.
          const mapped = MODAL_SORT_TO_LABEL[filters.sort];
          if (mapped) setSortBy(mapped);

          // Price presets arrive as "min-max" strings, e.g. "25-50".
          const band = filters.sections?.price?.[0];
          if (band) {
            const [min, max] = band.split('-').map(Number);
            setPriceBand(Number.isNaN(min) || Number.isNaN(max) ? null : [min, max]);
          } else {
            setPriceBand(null);
          }

          setAvailability(filters.sections?.availability ?? []);
        }}
      />
      {/* Location Search Modal */}
      <LocationSearchModal
        visible={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={(loc) => {
          useLocationStore.setState({ city: loc.city || loc.name, latitude: loc.lat || null, longitude: loc.lon || null });
          setShowLocationSearch(false);
        }}
      />

    </SafeAreaView>
  );
}
