import React, { useContext } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { getVendorSummary } from '../../api/analytics';
import { Header, ScreenBody, Section, Card, StatGrid, StatCard, Divider, shadow, font } from '../../components/vendor/kit';

const PAYOUT_HISTORY = [
  { id: 'PO-001', amount: 1840.0, date: 'May 25, 2026', method: 'Bank Transfer', status: 'completed' },
];

const money = (n: number) => `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function VendorPayoutsScreen() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);

  const { data: summary, isLoading } = useQuery({ queryKey: ['vendor-summary'], queryFn: () => getVendorSummary(token!), enabled: !!token });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      <Header title="Earnings & payouts" subtitle="Your balance and payout history" onBack={() => router.push('/vendor-dashboard' as any)} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScreenBody maxWidth={720}>
          {/* Balance hero */}
          <View style={[{ backgroundColor: colors.heroSurface, borderRadius: 24, padding: 24 }, shadow(3)]}>
            <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 1, color: colors.onHeroMuted, textTransform: 'uppercase' }}>Available balance</Text>
            <Text style={{ fontFamily: font.bold, fontSize: 42, color: colors.primary, letterSpacing: -1, marginTop: 6 }}>{money(summary?.total_revenue ?? 0)}</Text>
            <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.onHeroMuted, marginTop: 4, marginBottom: 20 }}>
              Your next automatic payout is on the 1st of next month.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => Alert.alert('Request payout', 'Your payout request will be processed within 2–3 business days to your registered bank account.')}
                style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.primaryDim : colors.primary })}
              >
                <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.onPrimary }}>Request payout</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Add bank', 'Go to Store Settings → Payout Settings to add or update your bank account details.')}
                style={{ flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.onHero }}>Add bank</Text>
              </Pressable>
            </View>
          </View>

          {/* Stats */}
          <StatGrid min={130}>
            <StatCard icon="trending-up-outline" label="This month" value={money(summary?.revenue_this_month ?? 0)} tone="success" hint="Earned since the 1st" />
            <StatCard icon="wallet-outline" label="All-time" value={money(summary?.total_revenue ?? 0)} hint="Total earned" />
            <StatCard icon="receipt-outline" label="Commission" value="4.5%" tone="warning" hint="Platform fee per sale" />
          </StatGrid>

          {/* Payout account */}
          <Section title="Payout account" caption="Where your earnings are sent.">
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="business-outline" size={22} color={colors.primaryDim} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>GCB Bank Ghana</Text>
                  <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, marginTop: 2 }}>•••• •••• •••• 4201</Text>
                </View>
                <Pressable
                  onPress={() => Alert.alert('Change bank account', 'Go to Store Settings → Payout Settings to update your bank account details.')}
                  style={({ pressed }) => ({ paddingHorizontal: 14, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted })}
                >
                  <Text style={{ fontFamily: font.labelM, fontSize: 13, color: colors.ink }}>Change</Text>
                </Pressable>
              </View>
            </Card>
          </Section>

          {/* History */}
          <Section title="Payout history" caption="A record of money sent to your account.">
            <Card padded={false}>
              {PAYOUT_HISTORY.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: p.status === 'completed' ? colors.successGhost : colors.warningGhost, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={p.status === 'completed' ? 'checkmark-circle' : 'time'} size={22} color={p.status === 'completed' ? colors.success : colors.warning} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>#{p.id}</Text>
                      <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }}>{p.date} · {p.method}</Text>
                    </View>
                    <Text style={{ fontFamily: font.bold, fontSize: 15, color: colors.ink }}>{money(p.amount)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        </ScreenBody>
      )}
    </SafeAreaView>
  );
}
