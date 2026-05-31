import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Platform, useWindowDimensions,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

const STATUSES = ['new', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  new: 'New Order',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};



// Simulated delivery codes — in prod these would come from the backend
const DELIVERY_CODES: Record<string, string> = {
  'EL-90120': '4921',
  'EL-90119': '7304',
  'EL-90118': '1847',
  'EL-90117': '5523',
};

export default function VendorOrderDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const orderId = (Array.isArray(id) ? id[0] : id) ?? 'EL-90120';
  const correctCode = DELIVERY_CODES[orderId] ?? '0000';

  const STATUS_CFG: Record<string, { bg: string; text: string }> = {
    new: { bg: colors.infoGhost, text: colors.info },
    packed: { bg: colors.warningGhost, text: colors.warning },
    shipped: { bg: colors.primaryGhost, text: colors.primaryDim },
    out_for_delivery: { bg: colors.primaryGhost, text: colors.primaryDim },
    delivered: { bg: colors.successGhost, text: colors.success },
  };

  // Start shipped orders in out_for_delivery state for demo, others start as packed
  const [currentStatus, setCurrentStatus] = useState('out_for_delivery');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);

  const cfg = STATUS_CFG[currentStatus];
  const canVerifyDelivery = currentStatus === 'out_for_delivery' || currentStatus === 'shipped';

  const handleVerifyPin = () => {
    if (pinInput === correctCode) {
      setVerifySuccess(true);
      setPinError('');
      setCurrentStatus('delivered');
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySuccess(false);
        setPinInput('');
      }, 2000);
    } else {
      setPinError('Incorrect delivery code. Please check with the customer.');
      setPinInput('');
    }
  };

  const handleCloseModal = () => {
    setShowVerifyModal(false);
    setPinInput('');
    setPinError('');
    setVerifySuccess(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.push('/vendor-dashboard/orders' as any)}
          style={{ marginRight: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Order #{orderId}</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>May 31, 2026 · 09:14 AM</Text>
        </View>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{STATUS_LABELS[currentStatus]}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20, gap: 16,
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: 'flex-start',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Left Column ─── */}
        <View style={{ flex: 1, gap: 16, width: isDesktop ? undefined : '100%' }}>

          {/* Delivery Code Banner — visible when out for delivery */}
          {canVerifyDelivery && (
            <View style={{
              borderRadius: 20, overflow: 'hidden',
              backgroundColor: colors.primary,
              padding: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.ink} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>Delivery Verification Required</Text>
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.ink, lineHeight: 20, marginBottom: 16 }}>
                When the driver reaches the customer, ask for their 4-digit delivery code to confirm successful delivery.
              </Text>
              <Pressable
                onPress={() => setShowVerifyModal(true)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                })}
              >
                <Ionicons name="keypad" size={20} color={colors.ink} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Enter Customer PIN</Text>
              </Pressable>
            </View>
          )}

          {/* Delivered confirmation */}
          {currentStatus === 'delivered' && (
            <View style={{
              borderRadius: 20, backgroundColor: '#dcfce7',
              padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={28} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#166534' }}>Delivery Confirmed!</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#15803d', marginTop: 2 }}>
                  Customer PIN was verified successfully.
                </Text>
              </View>
            </View>
          )}

          {/* Customer Info */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 14 }}>Customer</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="person" size={22} color="#7a8a05" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Ama Owusu</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost }}>ama@example.com</Text>
              </View>
              <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mail-outline" size={18} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          {/* Order Items */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 14 }}>Order Items</Text>
            {[
              { name: 'Wireless Noise-Cancelling Headphones', qty: 1, price: 149.99, variant: 'Black' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>{item.name}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost }}>×{item.qty} · {item.variant}</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Total</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#7a8a05' }}>$149.99</Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>Delivery Address</Text>
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 22 }}>
              123 Tech Avenue, Apt 4B{'\n'}San Francisco, CA 94105
            </Text>
          </View>
        </View>

        {/* ─── Right Column: Status Update ─── */}
        <View style={{ flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%', gap: 16 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Update Order Status</Text>
            <View style={{ gap: 8 }}>
              {STATUSES.filter(s => s !== 'delivered').map(status => {
                const isCurrent = status === currentStatus;
                const isPast = STATUSES.indexOf(status) < STATUSES.indexOf(currentStatus);
                return (
                  <Pressable
                    key={status}
                    onPress={() => setCurrentStatus(status)}
                    disabled={currentStatus === 'delivered'}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                      backgroundColor: isCurrent ? colors.ink : colors.surfaceSoft,
                      borderWidth: 1.5, borderColor: isCurrent ? colors.ink : colors.surfaceMuted,
                      opacity: currentStatus === 'delivered' ? 0.5 : 1,
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isCurrent ? colors.primary : (isPast ? colors.ink : colors.surfaceMuted),
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      {(isCurrent || isPast) && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isCurrent ? colors.primary : colors.ink }} />
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: isCurrent ? colors.surface : (isPast ? colors.ink : colors.inkGhost) }}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Delivered row — only via PIN */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                backgroundColor: currentStatus === 'delivered' ? '#dcfce7' : colors.surfaceSoft,
                borderWidth: 1.5, borderColor: currentStatus === 'delivered' ? '#16a34a' : colors.surfaceMuted,
              }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: currentStatus === 'delivered' ? '#16a34a' : colors.surfaceMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  {currentStatus === 'delivered' && (
                    <Ionicons name="checkmark" size={13} color="#16a34a" />
                  )}
                </View>
                <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: currentStatus === 'delivered' ? '#166534' : colors.inkGhost }}>
                  Delivered
                </Text>
                <View style={{ backgroundColor: colors.warningGhost, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.warning }}>PIN REQUIRED</Text>
                </View>
              </View>
            </View>
          </View>

          {canVerifyDelivery && (
            <Pressable
              onPress={() => setShowVerifyModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDim : colors.primary,
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              })}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.ink} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Verify Delivery with PIN</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.push('/vendor-dashboard/orders' as any)}
            style={{ backgroundColor: colors.surfaceSoft, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceMuted }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Save & Go Back</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── PIN Verify Modal ─── */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={handleCloseModal}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28,
              paddingBottom: 40,
            }}
          >
            {verifySuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink, marginBottom: 8 }}>Delivery Confirmed!</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>
                  The order has been marked as delivered.
                </Text>
              </View>
            ) : (
              <>
                {/* Handle */}
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignSelf: 'center', marginBottom: 24 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name="shield-checkmark" size={22} color={colors.primaryDim} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Enter Delivery PIN</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Ask the customer for their code</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginVertical: 20 }} />

                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>
                  4-Digit Delivery Code
                </Text>

                {/* PIN Input */}
                <TextInput
                  value={pinInput}
                  onChangeText={text => {
                    setPinError('');
                    if (text.length <= 4 && /^\d*$/.test(text)) setPinInput(text);
                  }}
                  placeholder="· · · ·"
                  placeholderTextColor={colors.inkGhost}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={false}
                  style={{
                    backgroundColor: colors.surfaceSoft,
                    borderRadius: 16, borderWidth: 2,
                    borderColor: pinError ? colors.error : pinInput.length === 4 ? colors.primary : colors.surfaceMuted,
                    paddingHorizontal: 24, paddingVertical: 20,
                    fontFamily: 'Inter_700Bold', fontSize: 36,
                    color: colors.ink, textAlign: 'center',
                    letterSpacing: 16,
                    marginBottom: 8,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  }}
                />

                {pinError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#dc2626', flex: 1 }}>{pinError}</Text>
                  </View>
                ) : (
                  <View style={{ height: 16 }} />
                )}

                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textAlign: 'center', marginBottom: 20 }}>
                  The customer received this code after payment. Both parties must agree before confirming delivery.
                </Text>

                <Pressable
                  onPress={handleVerifyPin}
                  disabled={pinInput.length < 4}
                  style={({ pressed }) => ({
                    backgroundColor: pinInput.length < 4 ? colors.surfaceMuted : (pressed ? colors.primaryDim : colors.primary),
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: pinInput.length < 4 ? colors.inkGhost : colors.ink }}>
                    Confirm Delivery
                  </Text>
                </Pressable>

                <Pressable onPress={handleCloseModal} style={{ paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
