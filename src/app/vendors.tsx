import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { listVendors, Vendor } from '../api/vendors';
import { getAllFollowing } from '../api/localFollows';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=200';

// ─── Vendor Grid Card ─────────────────────────────────────────────

interface GridCardProps {
  vendor: Vendor;
  isFollowed: boolean;
  colors: any;
}

function VendorGridCard({ vendor, isFollowed, colors }: GridCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(`/vendor/${vendor.id}` as any)}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: isFollowed ? 1.5 : 1,
        borderColor: isFollowed ? colors.primary : colors.surfaceMuted,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hovered ? 8 : 3 },
        shadowOpacity: colors.isDark ? (hovered ? 0.4 : 0.25) : (hovered ? 0.12 : 0.06),
        shadowRadius: hovered ? 20 : 10,
        elevation: hovered ? 8 : 3,
        // @ts-ignore
        transition: 'all 0.2s ease',
        transform: [{ scale: hovered ? 1.02 : 1 }],
      }}
    >
      {/* Banner */}
      <View style={{ height: 72, backgroundColor: colors.surfaceSoft }}>
        {vendor.banner_url ? (
          <Image
            source={{ uri: vendor.banner_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor:
                colors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            }}
          />
        )}
        {/* Gradient overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 36,
            backgroundColor: colors.isDark
              ? 'rgba(0,0,0,0.45)'
              : 'rgba(255,255,255,0.25)',
          }}
        />
      </View>

      {/* Body */}
      <View style={{ padding: 14, paddingTop: 8 }}>
        {/* Avatar row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: -28,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: isFollowed ? 2.5 : 2,
              borderColor: isFollowed ? colors.primary : colors.surface,
              overflow: 'hidden',
              backgroundColor: colors.surfaceSoft,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Image
              source={{ uri: vendor.logo_url ?? FALLBACK_AVATAR }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Following / Verified badge */}
          {isFollowed ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${colors.primary}22`,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: `${colors.primary}44`,
              }}
            >
              <Ionicons name="checkmark" size={11} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.primary }}>
                Following
              </Text>
            </View>
          ) : vendor.is_verified ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${colors.info}22`,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="shield-checkmark" size={11} color={colors.info} style={{ marginRight: 3 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.info }}>
                Verified
              </Text>
            </View>
          ) : null}
        </View>

        {/* Name */}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 14,
            color: colors.ink,
            marginBottom: 2,
          }}
        >
          {vendor.store_name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 11,
            color: colors.inkGhost,
            marginBottom: 8,
          }}
        >
          @{vendor.store_slug}
        </Text>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="storefront-outline" size={11} color={colors.inkGhost} />
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 11,
                color: colors.inkGhost,
                marginLeft: 3,
              }}
            >
              Visit Store
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────

export default function AllVendorsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [search, setSearch] = useState('');
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const loadFollows = useCallback(async () => {
    const ids = await getAllFollowing();
    setFollowedIds(new Set(ids));
  }, []);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['all-vendors'],
    queryFn: () => listVendors({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Sort: followed first, then alphabetical
  const sorted = useMemo(() => {
    const followed = vendors.filter(v => followedIds.has(v.id));
    const others = vendors.filter(v => !followedIds.has(v.id));
    others.sort((a, b) => a.store_name.localeCompare(b.store_name));
    return [...followed, ...others];
  }, [vendors, followedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      v =>
        v.store_name.toLowerCase().includes(q) ||
        v.store_slug.toLowerCase().includes(q) ||
        (v.bio ?? '').toLowerCase().includes(q)
    );
  }, [sorted, search]);

  // Build rows of 2 (mobile) or 3 (desktop)
  const cols = isDesktop ? 3 : 2;
  const rows: Vendor[][] = [];
  for (let i = 0; i < filtered.length; i += cols) {
    rows.push(filtered.slice(i, i + cols));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* ─── Header ─── */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: colors.isDark ? 0.3 : 0.06,
          shadowRadius: 16,
          elevation: 4,
          zIndex: 10,
        }}
      >
        {/* Back + title row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            })}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 22,
                color: colors.ink,
                letterSpacing: -0.3,
              }}
            >
              All Stores
            </Text>
            {!isLoading && (
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 12,
                  color: colors.inkGhost,
                  marginTop: 1,
                }}
              >
                {vendors.length} stores available
              </Text>
            )}
          </View>

          {/* Following count badge */}
          {followedIds.size > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${colors.primary}18`,
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: `${colors.primary}33`,
              }}
            >
              <Ionicons name="heart" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                  color: colors.primary,
                }}
              >
                {followedIds.size} Following
              </Text>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSoft,
            borderWidth: 1.5,
            borderColor: colors.surfaceMuted,
            borderRadius: 24,
            paddingHorizontal: 16,
            height: 46,
          }}
        >
          <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search stores..."
            placeholderTextColor={colors.inkGhost}
            style={{
              flex: 1,
              fontFamily: 'OpenSans_400Regular',
              fontSize: 14,
              color: colors.ink,
              ...({ outlineStyle: 'none' } as any),
            }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.inkGhost} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ─── Content ─── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 14,
              color: colors.inkMuted,
              marginTop: 12,
            }}
          >
            Loading stores...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 60,
            gap: 12,
          }}
        >
          {/* Followed section label */}
          {followedIds.size > 0 && !search.trim() && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                marginTop: 4,
              }}
            >
              <Ionicons name="heart" size={13} color={colors.primary} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                  color: colors.primary,
                }}
              >
                Stores You Follow
              </Text>
            </View>
          )}

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Ionicons name="storefront-outline" size={72} color={colors.surfaceMuted} />
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 18,
                  color: colors.inkMuted,
                  marginTop: 16,
                  marginBottom: 6,
                }}
              >
                No stores found
              </Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 13,
                  color: colors.inkGhost,
                  textAlign: 'center',
                }}
              >
                Try a different search term
              </Text>
            </View>
          ) : (
            rows.map((row, rIdx) => {
              // Insert "Other Stores" divider after followed section ends
              const firstOtherIdx = filtered.findIndex(v => !followedIds.has(v.id));
              const rowStartIdx = rIdx * cols;
              const showDivider =
                !search.trim() &&
                followedIds.size > 0 &&
                firstOtherIdx >= 0 &&
                rowStartIdx === Math.ceil(firstOtherIdx / cols) * cols &&
                rowStartIdx > 0;

              return (
                <React.Fragment key={rIdx}>
                  {showDivider && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: 8,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: colors.surfaceMuted,
                          marginRight: 10,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: 'Inter_600SemiBold',
                          fontSize: 12,
                          color: colors.inkGhost,
                        }}
                      >
                        All Stores
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundColor: colors.surfaceMuted,
                          marginLeft: 10,
                        }}
                      />
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {row.map(vendor => (
                      <VendorGridCard
                        key={vendor.id}
                        vendor={vendor}
                        isFollowed={followedIds.has(vendor.id)}
                        colors={colors}
                      />
                    ))}
                    {/* Fill empty cells in last row */}
                    {row.length < cols &&
                      Array.from({ length: cols - row.length }).map((_, i) => (
                        <View key={`empty-${i}`} style={{ flex: 1 }} />
                      ))}
                  </View>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
