import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useDebounce } from '../../hooks/useDebounce';
import { fetchSuggestions, fetchSearchResults, fetchTrendingSearches, SearchHit } from '../../api/search';
import { ProductCard } from '../../components/ProductCard';
import { useSearchStore } from '../../store/searchStore';
import { useEventStore } from '../../store/eventStore';

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  
  const insets = useSafeAreaInsets();
  const debouncedQuery = useDebounce(query, 300);

  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();
  const addEvent = useEventStore((state) => state.addEvent);

  // Fetch trending searches on mount
  useEffect(() => {
    let isMounted = true;
    fetchTrendingSearches().then(data => {
      if (isMounted) setTrendingSearches(data);
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    let isMounted = true;
    if (debouncedQuery.length > 1 && !hasSearched) {
      fetchSuggestions(debouncedQuery).then(data => {
        if (isMounted) setSuggestions(data);
      });
    } else {
      setSuggestions([]);
    }
    return () => { isMounted = false; };
  }, [debouncedQuery, hasSearched]);

  const handleSearchSubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setHasSearched(true);
    setIsSearching(true);
    setSuggestions([]);
    
    addRecentSearch(searchQuery);
    
    addEvent({
      event_type: 'product_search',
      metadata: { query: searchQuery }
    });
    
    const response = await fetchSearchResults(searchQuery);
    if (response && response.hits) {
      setResults(response.hits);
    } else {
      setResults([]);
    }
    setIsSearching(false);
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setSuggestions([]);
    setResults([]);
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
        
        {/* Autocomplete Suggestions Dropdown-like view */}
        {!hasSearched && suggestions.length > 0 && (
          <View style={{
            position: 'absolute',
            top: 130, // below the search bar
            left: 24,
            right: 24,
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.surfaceMuted,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            zIndex: 100,
            maxHeight: 250,
          }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
                    borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                    borderBottomColor: colors.surfaceMuted,
                  })}
                  onPress={() => handleSearchSubmit(suggestion)}
                >
                  <Ionicons name="search-outline" size={16} color={colors.inkGhost} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink }}>
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
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
                <Pressable>
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
        ) : hasSearched ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>
              Results for "{query}"
            </Text>
            
            {isSearching ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : results.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {results.map((hit) => {
                  const p = hit.document;
                  return (
                    <View key={p.id} style={{ width: Platform.OS === 'web' ? '31%' : '47%', marginBottom: 16 }}>
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
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="search" size={48} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted }}>
                  No products found.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
