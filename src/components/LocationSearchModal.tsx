import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export interface LocationResult {
  name: string;
  street: string;
  city: string;
  lat: number;
  lon: number;
}

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationResult) => void;
}

export const LocationSearchModal = ({ visible, onClose, onSelectLocation }: LocationSearchModalProps) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchLocation = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'ElectricApp/1.0' } }
      );
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error('Error searching location:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        searchLocation();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (item: any) => {
    const address = item.address;
    const result: LocationResult = {
      name: item.name || 'Selected Location',
      street: `${address?.house_number || ''} ${address?.road || ''}`.trim() || item.name,
      city: `${address?.city || address?.town || address?.village || ''}, ${address?.state || address?.country || ''}`.trim(),
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    };
    onSelectLocation(result);
    setQuery('');
    setResults([]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.surfaceSoft, paddingTop: Platform.OS === 'ios' ? 50 : 20 }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted
        }}>
          <Pressable onPress={onClose} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
            <Ionicons name="close" size={28} color={colors.ink} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Search Location</Text>
        </View>

        {/* Search Input */}
        <View style={{ padding: 20 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16, paddingHorizontal: 16, height: 52,
            borderWidth: 1.5, borderColor: colors.surfaceMuted,
          }}>
            <Ionicons name="search" size={20} color={colors.inkMuted} />
            <TextInput
              style={{
                flex: 1, marginLeft: 10,
                fontFamily: 'OpenSans_400Regular', fontSize: 16, color: colors.ink,
                ...Platform.select({ web: { outlineStyle: 'none' }, default: {} })
              } as any}
              placeholder="Search city, street, or address..."
              placeholderTextColor={colors.inkGhost}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.inkGhost} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : results.length > 0 ? (
            results.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelect(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', padding: 20,
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted
                })}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center', justifyContent: 'center', marginRight: 16
                }}>
                  <Ionicons name="location-outline" size={20} color={colors.inkMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink, marginBottom: 4 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : query.trim() !== '' ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={48} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.inkMuted }}>No results found</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
};
