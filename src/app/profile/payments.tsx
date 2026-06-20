import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiry: string;
  isDefault?: boolean;
}

const MOCK_CARDS: PaymentMethod[] = [
  { id: '1', type: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
];

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cards from local storage
  useEffect(() => {
    const loadCards = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_payments');
        if (stored) {
          setCards(JSON.parse(stored));
        } else {
          setCards(MOCK_CARDS);
        }
      } catch (e) {
        console.error('Failed to load payment methods:', e);
      } finally {
        setLoaded(true);
      }
    };
    loadCards();
  }, []);

  // Save cards to local storage whenever they change (only after initial load)
  useEffect(() => {
    if (!loaded) return;
    const saveCards = async () => {
      try {
        await AsyncStorage.setItem('@user_payments', JSON.stringify(cards));
      } catch (e) {
        console.error('Failed to save payment methods:', e);
      }
    };
    saveCards();
  }, [cards, loaded]);

  const handleSetDefault = (id: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === id,
    })));
    showToast('Default payment method updated.', 'success');
  };

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
          {cards.map(card => (
            <Pressable key={card.id} onPress={() => handleSetDefault(card.id)} style={{
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
            </Pressable>
          ))}

          <Pressable 
            onPress={() => showToast('Adding payment methods will be available soon.', 'info')}
            style={({ pressed }) => [{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
              padding: 20, borderRadius: 20,
              borderWidth: 1, borderColor: colors.surfaceMuted,
              marginTop: 8
            }]}
          >
            <Ionicons name="add" size={20} color={colors.ink} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Add New Payment Method</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
