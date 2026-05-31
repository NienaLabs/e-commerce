import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { WebHeader } from '../components/WebHeader';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const [step, setStep] = useState(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {isDesktop && <WebHeader />}

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Checkout</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        
        {step === 1 && (
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Shipping Address</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primary, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="home" size={20} color={colors.ink} style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Home</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>123 Tech Avenue, Apt 4B</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>San Francisco, CA 94105</Text>
            </View>

            <Pressable onPress={() => router.push('/profile/addresses' as any)} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.surfaceMuted, borderStyle: 'dashed', alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>+ Add New Address</Text>
            </Pressable>

            <Button title="Continue to Payment" onPress={() => setStep(2)} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Payment Method</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primary, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card" size={20} color={colors.ink} style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink }}>•••• •••• •••• 4242</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            </View>

            <Pressable style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="logo-apple" size={20} color={colors.ink} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink }}>Apple Pay</Text>
              </View>
            </Pressable>

            <Button title="Place Order" onPress={() => setStep(3)} />
          </View>
        )}

        {step === 3 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark" size={40} color={colors.primaryDim} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, marginBottom: 8 }}>Order Confirmed!</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center', marginBottom: 32 }}>
              Your order #EL-88942 has been placed successfully. You will receive an email confirmation shortly.
            </Text>
            <View style={{ width: '100%', gap: 12 }}>
              <Button title="View Order Status" onPress={() => router.replace('/profile/orders' as any)} />
              <Pressable onPress={() => router.replace('/(tabs)')} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Back to Home</Text>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
