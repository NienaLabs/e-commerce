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
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { PromoCard } from '@/components/PromoCard';
import { FilterModal } from '@/components/FilterModal';
import { LocationSearchModal, LocationResult } from '@/components/LocationSearchModal';
import { RecommendationShelfRow } from '@/components/RecommendationShelf';
import { VendorShelf } from '@/components/VendorShelf';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { listProducts, mapProductToCard, Product, getGroupedProducts, getHeroBanners } from '../../api/products';
import { getRecommendations, RecommendationResponse } from '../../api/recommendations';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../store/notificationStore';
import HeroBanner from '@/components/HeroBanner';
import { useSidebar } from '../../context/SidebarContext';

async function reverseGeocodeCity(lat: number, lng: number): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ElectricApp/1.0' } }
      );
      const data = await res.json();
      const a = data?.address;
      return a?.city || a?.town || a?.village || a?.county || a?.state || 'Current Location';
    } else {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const p = results[0];
        return p.city || p.district || p.region || p.subregion || 'Current Location';
      }
      return 'Current Location';
    }
  } catch {
    return 'Current Location';
  }
}

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', image: require('@/assets/3d icons/3d-headphones.png') },
  { id: 'fashion', label: 'Fashion', image: require('@/assets/3d icons/3d-clothes.png') },
  { id: 'home', label: 'Home & Living', image: require('@/assets/3d icons/3d-house.png') },
  { id: 'beauty', label: 'Accessories', image: require('@/assets/3d icons/3d-watch.png') },
  { id: 'sports', label: 'Sports', image: require('@/assets/3d icons/3d-sports.png') },
  { id: 'food', label: 'Food', image: require('@/assets/3d icons/3d-food.png') },
  { id: 'gaming', label: 'Gaming', image: require('@/assets/3d icons/3d-headphones.png') },
  { id: 'books', label: 'Books', image: require('@/assets/3d icons/3d-house.png') },
];

const SORT_OPTIONS = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Newest Arrivals', 'Best Sellers', 'Top Rated'];
const OFFER_OPTIONS = ['All Offers', 'Clearance Sale', 'Flash Sale', 'Buy 1 Get 1', 'Bundle Deals', 'Members Only'];
const RATING_OPTIONS = ['Any Rating', '4.5 Stars & Up', '4 Stars & Up', '3 Stars & Up', '2 Stars & Up'];
const BRAND_OPTIONS = ['All Brands', 'Sony', 'Apple', 'Samsung', 'Nike', 'Adidas', 'IKEA', 'Zara'];


type DropdownKey = 'Sort' | 'Offers' | 'Ratings' | 'Brand' | null;

export default function Home() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const { toggle } = useSidebar();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationStore((state) => state.notifications.filter((n) => !n.read).length);

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

  // Fetch real products from API
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => listProducts({ limit: 20 }),
  });

  // Fetch grouped products for category shelves
  const { data: groupedCategories = [], isLoading: groupedLoading } = useQuery({
    queryKey: ['groupedProducts'],
    queryFn: () => getGroupedProducts(15, 5),
  });

  // Fetch recommendation shelves (only if authenticated)
  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', token],
    queryFn: () => getRecommendations(token!, 20),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  // Fetch Flash Sales from API
  const { data: flashSales = [], isLoading: flashSalesLoading } = useQuery({
    queryKey: ['products', 'flash-sales'],
    queryFn: () => listProducts({ limit: 10, has_discount: true }),
  });

  // Fetch Hero Banners from API
  const { data: heroBanners = [], isLoading: heroBannersLoading } = useQuery({
    queryKey: ['heroBanners'],
    queryFn: () => getHeroBanners(),
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
        };
      })
      .filter(Boolean) as any[];
  }, [recommendations, productMap]);



  const mappedProducts = products.map(mapProductToCard);
  const filteredProducts = selectedCategory
    ? mappedProducts.filter((p) => (p as any).category === selectedCategory)
    : mappedProducts;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Location unavailable');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const city = await reverseGeocodeCity(loc.coords.latitude, loc.coords.longitude);
        setLocationName(city);
      } catch (e) {
        console.log('Location fetch error on home:', e);
        setLocationName('Location unavailable');
      }
    })();
  }, []);


  const renderDropdownChip = (
    label: DropdownKey & string,
    options: string[]
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
        <Text style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          color: openDropdown === label ? colors.surface : colors.inkSoft,
          marginRight: 5,
        }}>{label}</Text>
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
              {options.map((opt, i) => (
                <Pressable
                  key={opt}
                  onPress={() => setOpenDropdown(null)}
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
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkSoft }}>{opt}</Text>
                  {i === 0 && (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={12} color={colors.isDark ? colors.ink : '#222022'} />
                    </View>
                  )}
                </Pressable>
              ))}
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
                      {locationName.length > 20 ? locationName.substring(0, 20) + '...' : locationName}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                  </View>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => router.push('/notifications')}
                  style={{ marginRight: 16, position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                  {/* We need to import useNotificationStore at the top of the file to use it here. Let's do that in a separate edit. For now just place the code. */}
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
                  Deliver to: <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', textShadowRadius: 3 }}>{locationName}</Text>
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
          <View style={{ height: 350, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
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
              {CATEGORIES.map(cat => (
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
              {CATEGORIES.map(cat => (
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

              {renderDropdownChip('Sort', SORT_OPTIONS)}
              {renderDropdownChip('Offers', OFFER_OPTIONS)}
              {renderDropdownChip('Ratings', RATING_OPTIONS)}
              {renderDropdownChip('Brand', BRAND_OPTIONS)}
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
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                 <ActivityIndicator size="large" color={colors.primary} />
                 <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>
                   Loading categories...
                 </Text>
              </View>
            ) : (
              groupedCategories.map((group) => (
                <RecommendationShelfRow
                  key={group.category_id}
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
                {CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Results'}
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
                <View style={{ flex: 1, alignItems: 'center', paddingVertical: 48 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>
                    Loading products...
                  </Text>
                </View>
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
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    />
                  </View>
                ))
              )}
            </View>

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
      />
      {/* Location Search Modal */}
      <LocationSearchModal
        visible={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelectLocation={(loc) => {
          setLocationName(loc.city || loc.name);
          setShowLocationSearch(false);
        }}
      />

    </SafeAreaView>
  );
}
