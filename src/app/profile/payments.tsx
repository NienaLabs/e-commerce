import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';

const MOCK_CARDS = [
  { id: '1', type: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
  { id: '2', type: 'Mastercard', last4: '8888', expiry: '04/27', isDefault: false },
];

export default function PaymentsScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Payment Methods</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ gap: 16 }}>
          {MOCK_CARDS.map(card => (
            <View key={card.id} style={{
              backgroundColor: colors.surface, borderRadius: 20, padding: 20,
              borderWidth: card.isDefault ? 1.5 : 1,
              borderColor: card.isDefault ? colors.primary : colors.surfaceMuted,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.3 : 0.05, shadowRadius: 10, elevation: 2
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card" size={24} color={colors.ink} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{card.type} •••• {card.last4}</Text>
                </View>
                {card.isDefault && (
                  <View style={{ backgroundColor: colors.primaryGhost, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.primaryDim, textTransform: 'uppercase' }}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>Expires {card.expiry}</Text>
            </View>
          ))}

          <Pressable style={({ pressed }) => [{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
            padding: 20, borderRadius: 20,
            borderWidth: 1, borderColor: colors.surfaceMuted,
            marginTop: 8
          }]}>
            <Ionicons name="add" size={20} color={colors.ink} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Add New Payment Method</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
