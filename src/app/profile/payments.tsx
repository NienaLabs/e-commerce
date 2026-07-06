import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { WebHeader } from '../../components/WebHeader';

export default function PaymentsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)}
          style={{ padding: 8, marginRight: 8, marginLeft: -8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Payments</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 32 }}>
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: colors.successGhost,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Ionicons name="cash-outline" size={48} color={colors.success} />
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, marginBottom: 10, textAlign: 'center' }}>
            Pay on Delivery
          </Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>
            This platform does not process payments online. You pay directly to the vendor when they deliver your order in person.
          </Text>
        </View>

        {/* How it works */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted, gap: 20 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>How it works</Text>

          {[
            {
              icon: 'bag-handle-outline' as const,
              title: 'Place your order',
              desc: 'Browse products and place your order normally. You receive a 4-digit delivery PIN.',
            },
            {
              icon: 'car-outline' as const,
              title: 'Vendor delivers',
              desc: 'The vendor arranges delivery and contacts you directly to confirm timing.',
            },
            {
              icon: 'cash-outline' as const,
              title: 'Pay in cash',
              desc: 'When the vendor arrives and hands over your items, pay them the exact order total.',
            },
            {
              icon: 'keypad-outline' as const,
              title: 'Confirm with PIN',
              desc: 'Show your 4-digit PIN to the vendor. They enter it to mark the order as delivered.',
            },
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Ionicons name={step.icon} size={22} color={colors.primaryDim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginBottom: 3 }}>{step.title}</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.infoGhost, borderRadius: 14, padding: 14, marginTop: 20 }}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.info} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.info, lineHeight: 20 }}>
            Your PIN is generated when you place the order — not before. Only share it with the vendor after they physically hand over your items.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
