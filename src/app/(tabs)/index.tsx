import React, { useState, useEffect, useRef } from 'react'
import LottieView from 'lottie-react-native';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { PromoCard } from '@/components/PromoCard';
import { FilterModal } from '@/components/FilterModal';
import { LocationSearchModal, LocationResult } from '@/components/LocationSearchModal';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { listProducts, mapProductToCard } from '../../api/products';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  // Fetch real products from API
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => listProducts({ limit: 20 }),
  });

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ─── Header: Location + Search ─── */}
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: colors.isDark ? 0.3 : 0.05,
          shadowRadius: 16,
          elevation: 4,
          zIndex: 10,
        }}>
          {/* Mobile Header */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="location" size={20} color={colors.ink} />
                </View>
                <Pressable onPress={() => setShowLocationSearch(true)} style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 2 }}>Delivering to</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginRight: 4, flexShrink: 1 }} numberOfLines={1}>
                      {locationName.length > 20 ? locationName.substring(0, 20) + '...' : locationName}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.ink} />
                  </View>
                </Pressable>
              </View>

              <Pressable
                style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                }}
                onPress={() => router.push('/profile')}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>JD</Text>
              </Pressable>
            </View>
          )}

          {/* Desktop Location Header */}
          {isDesktop && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setShowLocationSearch(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Ionicons name="location" size={16} color={colors.ink} />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted, marginRight: 4 }}>
                  Deliver to: <Text style={{ color: colors.ink, fontFamily: 'Inter_700Bold' }}>{locationName}</Text>
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.ink} />
              </Pressable>
            </View>
          )}

          {/* Search Bar */}
          <Pressable
            onPress={() => router.push('/search')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSoft,
              borderWidth: 1.5,
              borderColor: colors.surfaceMuted,
              height: 52,
              borderRadius: 26,
              paddingHorizontal: 18,
            }}
          >
            <Ionicons name="search" size={20} color={colors.primary} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkGhost, marginLeft: 10, flex: 1 }}>
              Search products, brands...
            </Text>
          </Pressable>
        </View>

        {/* ─── Categories ─── */}
        <View style={{ paddingTop: 28, paddingBottom: 4 }}>
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

        {/* ─── Promotions / Deals Section ─── */}
        <View style={{ paddingTop: 28, paddingBottom: 8 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash" size={24} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.3 }}>
                Flash Sales
              </Text>
            </View>
            <Pressable onPress={() => router.push('/flash-sales' as any)}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary }}>See all</Text>
            </Pressable>
          </View>

          {isDesktop ? (
            <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 16, paddingBottom: 8 }}>
              <PromoCard imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800" />
              <PromoCard imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800" />
              <PromoCard imageUrl="https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16, paddingBottom: 8 }}>
              <PromoCard imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800" />
              <PromoCard imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800" />
              <PromoCard imageUrl="https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800" />
            </ScrollView>
          )}
        </View>

        {/* ─── Product Feed ─── */}
        <View style={{ paddingTop: 24, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, letterSpacing: -0.3 }}>
              {selectedCategory
                ? CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Results'
                : 'Suggested for you'}
            </Text>
            {selectedCategory ? (
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>
                {filteredProducts.length} items
              </Text>
            ) : (
              <Pressable onPress={() => router.push('/suggestions')}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>See all</Text>
              </Pressable>
            )}
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
      </ScrollView>

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
