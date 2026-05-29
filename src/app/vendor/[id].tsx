import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../../components/ProductCard';

// ─── Mock Vendor Data ────────────────────────────────────────────────────────
const VENDORS: Record<string, {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bannerUrl: string;
  description: string;
  rating: number;
  reviews: number;
  followers: number;
  products: number;
  joined: string;
  verified: boolean;
  tags: string[];
  productList: Array<{
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    vendorId: string;
    vendorName: string;
    vendorAvatar: string;
  }>;
}> = {
  'v1': {
    id: 'v1',
    name: 'SoundWave Audio',
    handle: '@soundwave',
    avatarUrl: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200',
    description: 'Premium audio equipment for audiophiles and everyday listeners alike. We craft sound experiences that move you.',
    rating: 4.8,
    reviews: 2340,
    followers: 12800,
    products: 48,
    joined: 'March 2021',
    verified: true,
    tags: ['Electronics', 'Audio', 'Headphones'],
    productList: [
      { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 199.99, salePrice: 149.99, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
      { id: '2', name: 'Minimalist Smart Watch Series 9', price: 299.00, imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
      { id: '7', name: 'Portable Bluetooth Speaker', price: 79.99, salePrice: 59.99, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
      { id: '8', name: 'Studio Monitor Earbuds Pro', price: 159.00, imageUrl: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&q=80&w=600', vendorId: 'v1', vendorName: 'SoundWave Audio', vendorAvatar: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  'v2': {
    id: 'v2',
    name: 'Urban Threads',
    handle: '@urbanthreads',
    avatarUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200',
    description: 'Contemporary fashion for the modern soul. Sustainable fabrics, timeless designs, boldly expressed.',
    rating: 4.6,
    reviews: 1820,
    followers: 9400,
    products: 120,
    joined: 'January 2020',
    verified: true,
    tags: ['Fashion', 'Streetwear', 'Sustainable'],
    productList: [
      { id: '3', name: 'Premium Organic Cotton T-Shirt', price: 29.99, salePrice: 19.99, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
      { id: '9', name: 'Relaxed Linen Overshirt', price: 64.00, imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
      { id: '10', name: 'Slim-Fit Chino Trousers', price: 58.00, salePrice: 42.00, imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600', vendorId: 'v2', vendorName: 'Urban Threads', vendorAvatar: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  'v3': {
    id: 'v3',
    name: 'Casa & Co.',
    handle: '@casaandco',
    avatarUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=1200',
    description: 'Beautiful home goods and artisan crafts for spaces that tell your story. Handpicked, handcrafted, home.',
    rating: 4.7,
    reviews: 980,
    followers: 5100,
    products: 63,
    joined: 'July 2022',
    verified: false,
    tags: ['Home', 'Decor', 'Artisan'],
    productList: [
      { id: '4', name: 'Artisan Ceramic Coffee Mug Set', price: 38.00, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
      { id: '11', name: 'Handwoven Seagrass Basket', price: 28.00, imageUrl: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&q=80&w=600', vendorId: 'v3', vendorName: 'Casa & Co.', vendorAvatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=200' },
    ],
  },
};

// Fallback for unknown vendor IDs
const getFallbackVendor = (id: string) => ({
  id,
  name: 'Vendor Store',
  handle: '@vendor',
  avatarUrl: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200',
  bannerUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200',
  description: 'Welcome to our store.',
  rating: 4.5,
  reviews: 0,
  followers: 0,
  products: 0,
  joined: '2024',
  verified: false,
  tags: [],
  productList: [],
});

const StatBox = ({ value, label }: { value: string; label: string }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>{value}</Text>
    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#6b696b', marginTop: 2 }}>{label}</Text>
  </View>
);

export default function VendorStorefront() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendor = VENDORS[id as string] ?? getFallbackVendor(id as string);
  const [isFollowing, setIsFollowing] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
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
            backdropFilter: 'blur(8px)',
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ─── Banner ─── */}
        <View style={{ height: 200, width: '100%', backgroundColor: '#eceae6' }}>
          <Image
            source={{ uri: vendor.bannerUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }} />
        </View>

        {/* ─── Profile Section ─── */}
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 24,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#222022',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}>
          {/* Avatar + Follow Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36 }}>
            {/* Avatar */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              borderWidth: 3, borderColor: '#ffffff',
              overflow: 'hidden',
              shadowColor: '#222022',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6,
            }}>
              <Image source={{ uri: vendor.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>

            {/* Follow Button */}
            <Pressable
              onPress={() => setIsFollowing(!isFollowing)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 22,
                paddingVertical: 11,
                borderRadius: 24,
                backgroundColor: isFollowing ? '#f5f5f0' : '#222022',
                borderWidth: isFollowing ? 1.5 : 0,
                borderColor: '#eceae6',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={16}
                color={isFollowing ? '#6b696b' : '#ffffff'}
                style={{ marginRight: 6 }}
              />
              <Text style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 14,
                color: isFollowing ? '#6b696b' : '#ffffff',
              }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          {/* Name + Handle */}
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#222022', marginRight: 8 }}>
                {vendor.name}
              </Text>
              {vendor.verified && (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#3a7ef5',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#9e9c9e', marginTop: 2 }}>
              {vendor.handle}
            </Text>
          </View>

          {/* Description */}
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', lineHeight: 22, marginBottom: 16 }}>
            {vendor.description}
          </Text>

          {/* Tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {vendor.tags.map(tag => (
              <View key={tag} style={{
                backgroundColor: '#c3d80918',
                borderWidth: 1, borderColor: '#c3d80960',
                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
              }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#7a8a05' }}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f5f5f0',
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 8,
          }}>
            <StatBox value={String(vendor.products)} label="Products" />
            <View style={{ width: 1, backgroundColor: '#eceae6' }} />
            <StatBox value={formatNumber(vendor.followers)} label="Followers" />
            <View style={{ width: 1, backgroundColor: '#eceae6' }} />
            <StatBox value={String(vendor.rating)} label="Rating" />
            <View style={{ width: 1, backgroundColor: '#eceae6' }} />
            <StatBox value={formatNumber(vendor.reviews)} label="Reviews" />
          </View>

          {/* Joined */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <Ionicons name="calendar-outline" size={14} color="#9e9c9e" style={{ marginRight: 5 }} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#9e9c9e' }}>
              Member since {vendor.joined}
            </Text>
          </View>
        </View>

        {/* ─── Products Grid ─── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022', letterSpacing: -0.3 }}>
              All Products
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#9e9c9e' }}>
              {vendor.productList.length} items
            </Text>
          </View>

          {vendor.productList.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="cube-outline" size={64} color="#eceae6" style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#9e9c9e' }}>
                No products yet
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {vendor.productList.map(product => (
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
                    vendorName={product.vendorName}
                    vendorAvatar={product.vendorAvatar}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                    onWishlist={() => {}}
                    onAddToCart={() => {}}
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
