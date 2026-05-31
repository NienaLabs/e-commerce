import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const recentSearches = ['Wireless Headphones', 'Mens Sneakers', 'Coffee Maker'];
  const trendingSearches = ['Summer Dress', 'Smart Watch', 'Sunglasses', 'Yoga Mat'];

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
            onChangeText={setQuery}
            placeholder="What are you looking for?"
            style={{ 
              flex: 1, height: '100%', marginLeft: 10, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
              ...Platform.select({ web: { outlineStyle: 'none' }, default: {} })
            } as any}
            placeholderTextColor={colors.inkGhost}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.inkGhost} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                  onPress={() => setQuery(item)}
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
                    onPress={() => setQuery(item)}
                  >
                    <Ionicons name="trending-up" size={16} color={colors.inkMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', paddingTop: 64 }}>
            <Ionicons name="search" size={80} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, color: colors.ink, marginBottom: 8 }}>
              Searching for "{query}"
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', maxWidth: 240 }}>
              Results will appear here shortly.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
