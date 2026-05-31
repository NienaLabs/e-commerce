import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: 'checkmark-circle', desc: 'Your order has been placed and confirmed.' },
  { key: 'packed', label: 'Packed', icon: 'cube', desc: 'Your items are being packaged by the vendor.' },
  { key: 'shipped', label: 'Shipped', icon: 'car', desc: 'Your order is on its way to the delivery hub.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle', desc: 'Your delivery agent has picked up your order.' },
  { key: 'delivered', label: 'Delivered', icon: 'home', desc: 'Package delivered successfully. Enjoy!' },
];

const MOCK_ORDER = {
  id: 'EL-88942',
  currentStep: 3, // 0-indexed; 3 = out_for_delivery
  estimatedDelivery: 'Today, 4:30 PM',
  agent: { name: 'Kofi Mensah', phone: '+233 55 000 1234', rating: 4.9 },
  items: [
    { name: 'Wireless Noise-Cancelling Headphones', qty: 1, price: 149.99 },
    { name: 'Premium Organic Cotton T-Shirt', qty: 2, price: 39.98 },
  ],
  address: '123 Tech Avenue, Apt 4B, San Francisco, CA',
  total: 194.97,
};

export default function OrderTracking() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [currentStep, setCurrentStep] = useState(MOCK_ORDER.currentStep);

  // Simulate live progress update
  useEffect(() => {
    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1)), 8000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const isDelivered = currentStep === STEPS.length - 1;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-122.45%2C37.76%2C-122.41%2C37.79&layer=mapnik`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/profile/orders' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Track Order</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>#{MOCK_ORDER.id}</Text>
        </View>
        {isDelivered && (
          <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#065f46' }}>Delivered!</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Map */}
        {!isDelivered && Platform.OS === 'web' && (
          <View style={{ height: isDesktop ? 300 : 200, backgroundColor: colors.surfaceMuted }}>
            {/* @ts-ignore */}
            <iframe src={osmUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Delivery Map" />
            <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>Agent en route</Text>
            </View>
          </View>
        )}

        <View style={{ padding: 20, gap: 16, flexDirection: isDesktop ? 'row' : 'column', alignItems: 'flex-start' }}>

          {/* Left column */}
          <View style={{ flex: 1, gap: 16 }}>

            {/* ETA Card */}
            <View style={{ backgroundColor: colors.isDark ? '#1a2a0a' : '#f0f8e0', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.isDark ? '#2d4010' : '#c3d80940' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="time" size={18} color={colors.primaryDim} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primaryDim }}>Estimated Arrival</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>{MOCK_ORDER.estimatedDelivery}</Text>
            </View>

            {/* Timeline */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 20 }}>Order Progress</Text>
              {STEPS.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isActive = idx === currentStep;
                return (
                  <View key={step.key} style={{ flexDirection: 'row', marginBottom: idx < STEPS.length - 1 ? 0 : 0 }}>
                    {/* Line + dot */}
                    <View style={{ alignItems: 'center', marginRight: 16, width: 32 }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: isDone ? (isActive ? colors.primary : colors.primaryGhost) : colors.surfaceSoft,
                        borderWidth: isActive ? 0 : 1.5,
                        borderColor: isDone ? colors.primary : colors.surfaceMuted,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons
                          name={step.icon as any}
                          size={16}
                          color={isDone ? (isActive ? (colors.isDark ? colors.ink : '#222022') : colors.primaryDim) : colors.inkGhost}
                        />
                      </View>
                      {idx < STEPS.length - 1 && (
                        <View style={{ width: 2, flex: 1, minHeight: 32, backgroundColor: idx < currentStep ? colors.primary : colors.surfaceMuted, marginVertical: 4 }} />
                      )}
                    </View>
                    {/* Text */}
                    <View style={{ flex: 1, paddingBottom: idx < STEPS.length - 1 ? 24 : 0 }}>
                      <Text style={{ fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: 14, color: isDone ? colors.ink : colors.inkGhost }}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 4, lineHeight: 18 }}>
                          {step.desc}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right column */}
          <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', gap: 16 }}>

            {/* Delivery Agent */}
            {!isDelivered && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Delivery Agent</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name="person" size={24} color={colors.primaryDim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>{MOCK_ORDER.agent.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="star" size={13} color={colors.primary} />
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkSoft, marginLeft: 4 }}>{MOCK_ORDER.agent.rating}</Text>
                    </View>
                  </View>
                  <Pressable style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="call" size={20} color={colors.primaryDim} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Order Summary */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Order Summary</Text>
              {MOCK_ORDER.items.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, flex: 1, marginRight: 8 }} numberOfLines={2}>{item.name} ×{item.qty}</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>${item.price.toFixed(2)}</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Total</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.primary }}>${MOCK_ORDER.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Delivery Address</Text>
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 22 }}>{MOCK_ORDER.address}</Text>
            </View>

            {isDelivered && (
              <Pressable
                onPress={() => router.push('/product/1' as any)}
                style={{ backgroundColor: colors.primaryGhost, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryBorder }}>
                <Ionicons name="star" size={18} color={colors.primaryDim} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.primaryDim }}>Leave a Review</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
