import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';

const TIERS = [
  { name: 'Bronze', minPoints: 0, icon: '🥉', color: '#cd7f32' },
  { name: 'Silver', minPoints: 500, icon: '🥈', color: '#9ca3af' },
  { name: 'Gold', minPoints: 1200, icon: '🥇', color: '#f59e0b' },
  { name: 'Platinum', minPoints: 3000, icon: '💎', color: '#6366f1' },
];

const VOUCHERS = [
  { id: 'v1', title: '5% Off Next Order', points: 200, expires: 'Jun 30, 2026', icon: 'pricetag' },
  { id: 'v2', title: 'Free Delivery', points: 100, expires: 'Jul 15, 2026', icon: 'bicycle' },
  { id: 'v3', title: '$10 Off $100+', points: 500, expires: 'Jun 15, 2026', icon: 'cash' },
];

const HISTORY = [
  { id: 'h1', label: 'Order #EL-88942 completed', points: +120, date: 'May 28, 2026' },
  { id: 'h2', label: 'Referral bonus — Ama joined', points: +50, date: 'May 20, 2026' },
  { id: 'h3', label: 'Redeemed: Free Delivery voucher', points: -100, date: 'May 15, 2026' },
  { id: 'h4', label: 'Order #EL-78431 completed', points: +90, date: 'May 10, 2026' },
];

const CURRENT_POINTS = 680;

export default function RewardsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const currentTierIdx = TIERS.reduce((acc, t, i) => CURRENT_POINTS >= t.minPoints ? i : acc, 0);
  const nextTier = TIERS[currentTierIdx + 1];
  const progress = nextTier
    ? (CURRENT_POINTS - TIERS[currentTierIdx].minPoints) / (nextTier.minPoints - TIERS[currentTierIdx].minPoints)
    : 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Rewards & Loyalty</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20, maxWidth: isDesktop ? 720 : undefined, alignSelf: 'center', width: '100%' }}>

        {/* Points Balance Card */}
        <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 28, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#ffffff80', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your Balance</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 52, color: colors.primary, lineHeight: 60 }}>{CURRENT_POINTS}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#ffffff99', marginBottom: 20 }}>Points</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff18', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>{TIERS[currentTierIdx].icon}</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' }}>{TIERS[currentTierIdx].name} Member</Text>
          </View>
        </View>

        {/* Tier Progress */}
        {nextTier && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>Progress to {nextTier.name}</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>
                {CURRENT_POINTS} / {nextTier.minPoints} pts
              </Text>
            </View>
            <View style={{ height: 10, backgroundColor: colors.surfaceSoft, borderRadius: 10, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 10 }} />
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 10 }}>
              Earn {nextTier.minPoints - CURRENT_POINTS} more points to unlock {nextTier.icon} {nextTier.name} status
            </Text>
          </View>
        )}

        {/* Tier Cards */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 14 }}>Membership Tiers</Text>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {TIERS.map((tier, idx) => {
              const isActive = idx === currentTierIdx;
              return (
                <View key={tier.name} style={{
                  flex: 1, minWidth: 120,
                  backgroundColor: isActive ? colors.ink : colors.surface,
                  borderRadius: 18, padding: 16, alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: isActive ? colors.ink : colors.surfaceMuted,
                }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>{tier.icon}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: isActive ? colors.surface : colors.ink }}>{tier.name}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: isActive ? '#ffffff80' : colors.inkGhost, marginTop: 4 }}>
                    {tier.minPoints === 0 ? 'Starting tier' : `${tier.minPoints}+ pts`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Vouchers */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 14 }}>Redeem Vouchers</Text>
          <View style={{ gap: 12 }}>
            {VOUCHERS.map(v => {
              const canRedeem = CURRENT_POINTS >= v.points;
              return (
                <View key={v.id} style={{ backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Ionicons name={v.icon as any} size={22} color={colors.primaryDim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink }}>{v.title}</Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 3 }}>Expires {v.expires}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: canRedeem ? colors.primaryDim : colors.inkGhost }}>{v.points} pts</Text>
                    <Pressable
                      disabled={!canRedeem}
                      onPress={() => {
                        if (canRedeem) {
                          Alert.alert(
                            'Redeem Voucher',
                            `Redeem "${v.title}" for ${v.points} points? This will be applied to your next order.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Redeem', onPress: () => Alert.alert('Success!', `Your "${v.title}" voucher has been applied. Use it at checkout before ${v.expires}.`) },
                            ]
                          );
                        }
                      }}
                      style={{ marginTop: 6, backgroundColor: canRedeem ? colors.ink : colors.surfaceSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: canRedeem ? colors.surface : colors.inkGhost }}>Redeem</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>


        {/* History */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 14 }}>Points History</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
            {HISTORY.map((h, i) => (
              <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < HISTORY.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceMuted }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>{h.label}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>{h.date}</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: h.points > 0 ? '#22c55e' : '#dc2626' }}>
                  {h.points > 0 ? `+${h.points}` : h.points}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
