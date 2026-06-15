import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, ActivityIndicator, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useDebounce } from '../../hooks/useDebounce';
import { fetchSuggestions, fetchSearchResults, fetchVendorSearchResults, fetchTrendingSearches, SearchHit } from '../../api/search';
import { ProductCard } from '../../components/ProductCard';
import { useSearchStore } from '../../store/searchStore';
import { useEventStore } from '../../store/eventStore';

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [vendorSuggestions, setVendorSuggestions] = useState<any[]>([]);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [vendorResults, setVendorResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [committedQuery, setCommittedQuery] = useState('');
  const committedQueryRef = useRef('');
  const hasSearchedRef = useRef(false);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const debouncedQuery = useDebounce(query, 300);

  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();
  const addEvent = useEventStore((state) => state.addEvent);

  useEffect(() => {
    committedQueryRef.current = committedQuery;
  }, [committedQuery]);

  useEffect(() => {
    hasSearchedRef.current = hasSearched;
  }, [hasSearched]);

  // Fetch trending searches on mount
  useEffect(() => {
    let isMounted = true;
    fetchTrendingSearches().then(data => {
      if (isMounted) setTrendingSearches(data);
    });
    return () => { isMounted = false; };
  }, []);

  const getLocalSuggestions = useCallback((value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return [];

    return [...recentSearches, ...trendingSearches]
      .filter((item, index, source) => {
        const lowerItem = item.toLowerCase();
        return lowerItem.includes(normalized) && source.findIndex((candidate) => candidate.toLowerCase() === lowerItem) === index;
      })
      .slice(0, 8);
  }, [recentSearches, trendingSearches]);

  // YouTube-style behavior: typing previews suggestions, selection/submission performs the search.
  useEffect(() => {
    let isMounted = true;
    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length > 0 && !hasSearched) {
      setHasSearched(false);
      setIsLoadingSuggestions(true);

      fetchSuggestions(trimmedQuery).then(data => {
        if (!isMounted || hasSearchedRef.current || trimmedQuery === committedQueryRef.current) return;

        const remoteSuggestions = data.suggestions || [];
        const remoteVendors = data.vendors || [];

        const localSuggestions = getLocalSuggestions(trimmedQuery);
        const mergedSuggestions = [trimmedQuery, ...remoteSuggestions, ...localSuggestions]
          .map((item) => item.trim())
          .filter(Boolean)
          .filter((item, index, source) => source.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
          .slice(0, 8);

        setSuggestions(mergedSuggestions);
        setVendorSuggestions(remoteVendors);
        setIsLoadingSuggestions(false);
      });
    } else if (trimmedQuery.length > 0) {
      setSuggestions([]);
      setVendorSuggestions([]);
      setIsLoadingSuggestions(false);
    } else {
      setHasSearched(false);
      setResults([]);
      setVendorResults([]);
      setSuggestions([]);
      setVendorSuggestions([]);
      setCommittedQuery('');
      setIsLoadingSuggestions(false);
    }
    return () => { isMounted = false; };
  }, [debouncedQuery, getLocalSuggestions, hasSearched]);

  const handleSearchSubmit = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    setQuery(trimmedQuery);
    setSuggestions([]);
    setVendorSuggestions([]);
    setCommittedQuery(trimmedQuery);
    
    addRecentSearch(trimmedQuery);
    
    addEvent({
      event_type: 'product_search',
      metadata: { query: trimmedQuery }
    });
    
    // Explicitly fetch on submit for instant feedback, though useEffect handles debounced
    setHasSearched(true);
    setIsSearching(true);
    
    const [response, vendorResponse] = await Promise.all([
      fetchSearchResults(trimmedQuery),
      fetchVendorSearchResults(trimmedQuery)
    ]);

    if (response && response.hits) {
      setResults(response.hits);
    } else {
      setResults([]);
    }

    if (vendorResponse && vendorResponse.hits) {
      setVendorResults(vendorResponse.hits.map((h: any) => h.document));
    } else {
      setVendorResults([]);
    }

    setIsSearching(false);
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setResults([]);
    setVendorResults([]);
    setSuggestions([]);
    setVendorSuggestions([]);
    setCommittedQuery('');
  };

  const handleSuggestionFill = (searchQuery: string) => {
    setQuery(searchQuery);
    setHasSearched(false);
  };

  const renderSuggestionText = (suggestion: string) => {
    const trimmedQuery = query.trim();
    const matchIndex = suggestion.toLowerCase().indexOf(trimmedQuery.toLowerCase());

    if (!trimmedQuery || matchIndex < 0) {
      return (
        <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: colors.ink }}>
          {suggestion}
        </Text>
      );
    }

    const beforeMatch = suggestion.slice(0, matchIndex);
    const match = suggestion.slice(matchIndex, matchIndex + trimmedQuery.length);
    const afterMatch = suggestion.slice(matchIndex + trimmedQuery.length);

    return (
      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink }}>
        {beforeMatch}
        <Text style={{ fontFamily: 'OpenSans_600SemiBold', color: colors.ink }}>{match}</Text>
        {afterMatch}
      </Text>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, flex: 1 }}>
            Search
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSoft,
          borderWidth: 1.5,
          borderColor: colors.surfaceMuted,
          height: 52,
          borderRadius: 26,
          paddingHorizontal: 16,
        }}>
          <Ionicons name="search" size={20} color={colors.inkMuted} />
          <TextInput 
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setHasSearched(false);
              setCommittedQuery('');
            }}
            onSubmitEditing={() => handleSearchSubmit(query)}
            placeholder="What are you looking for?"
            style={{ 
              flex: 1, height: '100%', marginLeft: 10, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
              ...Platform.select({ web: { outlineStyle: 'none' }, default: {} })
            } as any}
            placeholderTextColor={colors.inkGhost}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={colors.inkGhost} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {query.length === 0 ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            {/* Recent Searches */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Recent</Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>Clear</Text>
                </Pressable>
              </View>
              {recentSearches.map((item, index) => (
                <Pressable 
                  key={index}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}
                  onPress={() => handleSearchSubmit(item)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.inkGhost} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkSoft, flex: 1 }}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.surfaceMuted} />
                </Pressable>
              ))}
            </View>

            {/* Trending Searches */}
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Trending Now</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {trendingSearches.map((item, index) => (
                  <Pressable
                    key={index}
                    style={{
                      backgroundColor: colors.surfaceSoft,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => handleSearchSubmit(item)}
                  >
                    <Ionicons name="trending-up" size={16} color={colors.inkMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : !hasSearched ? (
          <View style={{ paddingTop: 4 }}>
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <Pressable
                  key={`${item}-${index}`}
                  style={({ pressed }) => ({
                    minHeight: 50,
                    paddingHorizontal: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
                  })}
                  onPress={() => handleSearchSubmit(item)}
                >
                  <Ionicons name="search-outline" size={20} color={colors.inkMuted} style={{ marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    {renderSuggestionText(item)}
                  </View>
                  <Pressable
                    accessibilityLabel={`Fill search with ${item}`}
                    hitSlop={12}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleSuggestionFill(item);
                    }}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 }}
                  >
                    <Ionicons name="arrow-up-outline" size={18} color={colors.inkMuted} style={{ transform: [{ rotate: '-45deg' }] }} />
                  </Pressable>
                </Pressable>
              ))
            ) : null}

            {vendorSuggestions.length > 0 && (
              <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted, marginBottom: 12 }}>
                  Stores
                </Text>
                {vendorSuggestions.map((vendor, index) => (
                  <Pressable
                    key={`vendor-${vendor.id}`}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      opacity: pressed ? 0.7 : 1,
                    })}
                    onPress={() => router.push(`/vendor/${vendor.id}` as any)}
                  >
                    {vendor.logo_url ? (
                      <Image source={{ uri: vendor.logo_url }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 16 }} />
                    ) : (
                      <Ionicons name="storefront-outline" size={24} color={colors.inkSoft} style={{ marginRight: 16 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: colors.ink }}>
                        {vendor.store_name}
                      </Text>
                      {vendor.bio && (
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }} numberOfLines={1}>
                          {vendor.bio}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.surfaceMuted} />
                  </Pressable>
                ))}
              </View>
            )}

            {suggestions.length === 0 && vendorSuggestions.length === 0 && (
              <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
                <View style={{
                  minHeight: 72,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1,
                  borderColor: colors.surfaceMuted,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name={isLoadingSuggestions ? 'hourglass-outline' : 'search-outline'} size={22} color={colors.inkMuted} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, flex: 1 }}>
                    {isLoadingSuggestions ? 'Finding suggestions...' : 'Press search to look for this.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : hasSearched ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>
              Results for "{committedQuery || query}"
            </Text>
            
            {isSearching ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                {vendorResults.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>
                      Stores
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                      {vendorResults.map(vendor => (
                        <Pressable
                          key={vendor.id}
                          style={({ pressed }) => ({
                            width: 200,
                            backgroundColor: colors.surfaceSoft,
                            borderRadius: 12,
                            padding: 16,
                            opacity: pressed ? 0.8 : 1,
                            borderWidth: 1,
                            borderColor: colors.surfaceMuted,
                          })}
                          onPress={() => router.push(`/vendor/${vendor.id}` as any)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            {vendor.logo_url ? (
                              <Image source={{ uri: vendor.logo_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                            ) : (
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Ionicons name="storefront" size={20} color={colors.primary} />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }} numberOfLines={1}>
                                {vendor.store_name}
                              </Text>
                            </View>
                          </View>
                          {vendor.bio && (
                            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }} numberOfLines={2}>
                              {vendor.bio}
                            </Text>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {results.length > 0 ? (
                  <View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>
                      Products
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                      {results.map((hit) => {
                  const p = hit.document;
                  return (
                    <View key={p.id} style={{ width: isDesktop ? '31%' : '100%', marginBottom: 16 }}>
                      <ProductCard
                        id={p.id}
                        name={p.name}
                        price={p.price}
                        salePrice={p.discount_price}
                        imageUrl={p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
                        vendorId={p.vendor_id}
                        vendorName="View Store"
                        onPress={() => router.push(`/product/${p.id}` as any)}
                      />
                    </View>
                  );
                })}
                    </View>
                  </View>
            ) : vendorResults.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="search" size={48} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted }}>
                  No products or stores found.
                </Text>
              </View>
            ) : null}
            </>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
