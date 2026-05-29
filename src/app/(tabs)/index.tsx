import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { PromoCard } from '@/components/PromoCard';
import { FilterModal } from '@/components/FilterModal';
import { router } from 'expo-router';
import * as Location from 'expo-location';

// Reverse geocode helper — uses Nominatim (free, no key) on web,
// and expo-location's native geocoder on iOS/Android.
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
  { id: 'electronics', label: 'Electronics', icon: 'headset' as const },
  { id: 'fashion', label: 'Fashion', icon: 'shirt' as const },
  { id: 'home', label: 'Home & Living', icon: 'home' as const },
  { id: 'beauty', label: 'Beauty', icon: 'flower' as const },
  { id: 'sports', label: 'Sports', icon: 'bicycle' as const },
  { id: 'food', label: 'Food', icon: 'restaurant' as const },
];

const SORT_OPTIONS = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Newest Arrivals', 'Best Sellers', 'Top Rated'];
const OFFER_OPTIONS = ['All Offers', 'Clearance Sale', 'Flash Sale', 'Buy 1 Get 1', 'Bundle Deals', 'Members Only'];
const RATING_OPTIONS = ['Any Rating', '4.5 Stars & Up', '4 Stars & Up', '3 Stars & Up', '2 Stars & Up'];
const BRAND_OPTIONS = ['All Brands', 'Sony', 'Apple', 'Samsung', 'Nike', 'Adidas', 'IKEA', 'Zara'];

const SAMPLE_PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 199.99, salePrice: 149.99, category: 'electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Minimalist Smart Watch Series 9', price: 299.00, category: 'electronics', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'Premium Organic Cotton T-Shirt', price: 29.99, salePrice: 19.99, category: 'fashion', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '4', name: 'Artisan Ceramic Coffee Mug Set', price: 38.00, category: 'home', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
  { id: '5', name: 'Running Pro Sneakers Ultra', price: 120.00, salePrice: 89.99, category: 'sports', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
  { id: '6', name: 'Vitamin C Brightening Serum', price: 45.00, category: 'beauty', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
];

type DropdownKey = 'Sort' | 'Offers' | 'Ratings' | 'Brand' | null;

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

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

  const filteredProducts = selectedCategory
    ? SAMPLE_PRODUCTS.filter(p => p.category === selectedCategory)
    : SAMPLE_PRODUCTS;

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
            backgroundColor: openDropdown === label ? '#222022' : '#ffffff',
            borderWidth: openDropdown === label ? 0 : 1,
            borderColor: '#eceae6',
            borderRadius: 20,
            paddingHorizontal: 14,
            height: 38,
            shadowColor: '#222022',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.07,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
      >
        <Text style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          color: openDropdown === label ? '#ffffff' : '#3a383a',
          marginRight: 5,
        }}>{label}</Text>
        <Ionicons
          name={openDropdown === label ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={openDropdown === label ? '#c3d809' : '#6b696b'}
        />
      </Pressable>

      <Modal visible={openDropdown === label} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(34,32,34,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setOpenDropdown(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 340,
              shadowColor: '#222022',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.18,
              shadowRadius: 60,
              elevation: 20,
              overflow: 'hidden',
            }}
            onPress={e => e.stopPropagation()}
          >
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#eceae6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#222022' }}>{label}</Text>
              <Pressable
                onPress={() => setOpenDropdown(null)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f0', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={20} color="#6b696b" />
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
                    backgroundColor: pressed ? '#f5f5f0' : 'transparent',
                  }]}
                >
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: '#3a383a' }}>{opt}</Text>
                  {i === 0 && (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#c3d809', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={12} color="#222022" />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ─── Header: Location + Search ─── */}
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          shadowColor: '#222022',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.09,
          shadowRadius: 10,
          elevation: 4,
          zIndex: 10,
        }}>
          {/* Top Row: Location + Avatar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#c3d80920',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: '#c3d80960',
                marginRight: 10,
              }}>
                <Ionicons name="location" size={20} color="#c3d809" />
              </View>
              <View>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: '#6b696b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                  Deliver to
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022', marginRight: 4 }}>
                    {locationName}
                  </Text>
                  <Ionicons name="chevron-down" size={15} color="#222022" />
                </View>
              </View>
            </Pressable>

            <Pressable
              style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: '#f5f5f0',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: '#eceae6',
              }}
              onPress={() => router.push('/profile')}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#222022' }}>JD</Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <Pressable
            onPress={() => router.push('/search')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f5f5f0',
              borderWidth: 1.5,
              borderColor: '#eceae6',
              height: 52,
              borderRadius: 26,
              paddingHorizontal: 18,
            }}
          >
            <Ionicons name="search" size={20} color="#c3d809" />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#9e9c9e', marginLeft: 10, flex: 1 }}>
              Search products, brands...
            </Text>
          </Pressable>
        </View>

        {/* ─── Categories ─── */}
        <View style={{ paddingTop: 28, paddingBottom: 4 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#222022', letterSpacing: -0.3 }}>
              Shop by Category
            </Text>
            <Pressable>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#6b696b' }}>View all</Text>
            </Pressable>
          </View>

          {isDesktop ? (
            // Desktop: spread all categories evenly across the full row
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
                  iconName={cat.icon}
                  isActive={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  flex
                />
              ))}
            </View>
          ) : (
            // Mobile: horizontal scroll
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16, paddingBottom: 8 }}>
              {CATEGORIES.map(cat => (
                <CategoryCard
                  key={cat.id}
                  label={cat.label}
                  iconName={cat.icon}
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
            backgroundColor: '#ffffff',
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 16,
            shadowColor: '#222022',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#eceae6',
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
              {/* Filter icon button */}
              <Pressable
                onPress={() => setShowFilterModal(true)}
                style={({ pressed }) => [{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: pressed ? '#3a383a' : '#222022',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#222022',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }]}
              >
                <Ionicons name="options" size={18} color="#ffffff" />
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
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#222022', letterSpacing: -0.3 }}>
              Today's Deals
            </Text>
            <Pressable>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#6b696b' }}>See all</Text>
            </Pressable>
          </View>

          {isDesktop ? (
            // Desktop: 3 equal-width cards filling the full row
            <View style={{ flexDirection: 'row', paddingHorizontal: 24, gap: 16, paddingBottom: 8 }}>
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"

              />
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800"

              />
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800"

              />
            </View>
          ) : (
            // Mobile: horizontal scroll with fixed-width cards
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16, paddingBottom: 8 }}>
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"

              />
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800"

              />
              <PromoCard
                imageUrl="https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800"

              />
            </ScrollView>
          )}
        </View>

        {/* ─── Product Feed ─── */}
        <View style={{ paddingTop: 24, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#222022', letterSpacing: -0.3 }}>
              {selectedCategory
                ? CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Results'
                : 'Suggested for you'}
            </Text>
            {selectedCategory && (
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#6b696b' }}>
                {filteredProducts.length} items
              </Text>
            )}
          </View>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            {filteredProducts.map(product => (
              <View
                key={product.id}
                style={{ width: isDesktop ? '48%' : '100%' }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  salePrice={product.salePrice}
                  imageUrl={product.image}
                  vendorId={product.vendorId}
                  vendorName={product.vendorName}
                  vendorAvatar={product.vendorAvatar}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                  onWishlist={() => { }}
                  onAddToCart={() => { }}
                />
              </View>
            ))}
          </View>

          {filteredProducts.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="search-outline" size={80} color="#eceae6" style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, color: '#222022', marginBottom: 8 }}>
                No items found
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', textAlign: 'center', maxWidth: 240 }}>
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
    </SafeAreaView>
  );
}
