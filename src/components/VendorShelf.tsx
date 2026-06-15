import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { listVendors, Vendor } from '../api/vendors';
import { getAllFollowing } from '../api/localFollows';

// ─── Single vendor card ───────────────────────────────────────────

interface VendorCardProps {
  vendor: Vendor;
  isFollowed: boolean;
  colors: any;
}

function VendorCard({ vendor, isFollowed, colors }: VendorCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(`/vendor/${vendor.id}` as any)}
      // @ts-ignore — web-only hover props
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 110,
        alignItems: 'center',
        transform: [{ scale: hovered ? 1.04 : 1 }],
        // @ts-ignore
        transition: 'transform 0.18s ease',
      }}
    >
      {/* Avatar circle */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: isFollowed ? 2.5 : 1.5,
          borderColor: isFollowed ? colors.primary : colors.surfaceMuted,
          overflow: 'hidden',
          backgroundColor: colors.surfaceSoft,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: colors.isDark ? 0.35 : 0.10,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        {vendor.logo_url ? (
          <Image
            source={{ uri: vendor.logo_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 22,
                color: colors.inkMuted,
              }}
            >
              {vendor.store_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Following badge */}
      {isFollowed && (
        <View
          style={{
            position: 'absolute',
            top: 50,
            right: 16,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        >
          <Ionicons name="checkmark" size={11} color={colors.isDark ? colors.ink : '#222'} />
        </View>
      )}

      {/* Verified badge */}
      {vendor.is_verified && !isFollowed && (
        <View
          style={{
            position: 'absolute',
            top: 50,
            right: 16,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.info,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        >
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}

      {/* Store name */}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          color: colors.ink,
          marginTop: 8,
          textAlign: 'center',
          maxWidth: 100,
        }}
      >
        {vendor.store_name}
      </Text>

      {/* Rating pill */}
      {vendor.avg_rating > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 3,
          }}
        >
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 11,
              color: colors.inkGhost,
              marginLeft: 2,
            }}
          >
            {vendor.avg_rating.toFixed(1)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────

function VendorCardSkeleton({ colors }: { colors: any }) {
  return (
    <View style={{ width: 110, alignItems: 'center' }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.surfaceMuted,
          opacity: 0.5,
        }}
      />
      <View
        style={{
          width: 60,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.surfaceMuted,
          marginTop: 10,
          opacity: 0.4,
        }}
      />
    </View>
  );
}

// ─── Main shelf export ────────────────────────────────────────────

export function VendorShelf() {
  const { colors } = useTheme();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  // Load followed vendor IDs from local storage
  const loadFollows = useCallback(async () => {
    const ids = await getAllFollowing();
    setFollowedIds(new Set(ids));
  }, []);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors-shelf'],
    queryFn: () => listVendors({ limit: 30 }),
    staleTime: 5 * 60 * 1000,
  });

  // Sort: followed vendors first, then rest alphabetically
  const sorted = React.useMemo(() => {
    const followed = vendors.filter(v => followedIds.has(v.id));
    const others = vendors.filter(v => !followedIds.has(v.id));
    others.sort((a, b) => a.store_name.localeCompare(b.store_name));
    return [...followed, ...others];
  }, [vendors, followedIds]);

  return (
    <View style={{ paddingTop: 20, paddingBottom: 8 }}>
      {/* Section header */}
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 22,
            color: colors.ink,
            letterSpacing: -0.3,
          }}
        >
          Shop by Store
        </Text>

        <Pressable
          onPress={() => router.push('/vendors' as any)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
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
            View all
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.inkMuted} />
        </Pressable>
      </View>

      {/* Horizontal scroll list */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <VendorCardSkeleton key={i} colors={colors} />
          ))}
        </ScrollView>
      ) : sorted.length === 0 ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, gap: 16 }}
        >
          {sorted.map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              isFollowed={followedIds.has(vendor.id)}
              colors={colors}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
