import React, { useContext } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { getVendorSummary } from '../../api/analytics';

const PAYOUT_HISTORY = [
  { id: 'PO-001', amount: 1840.00, date: 'May 25, 2026', method: 'Bank Transfer', status: 'completed' },
];

export default function VendorPayoutsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useContext(AuthContext);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['vendor-summary'],
    queryFn: () => getVendorSummary(token!),
    enabled: !!token,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Earnings & Payouts</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20, maxWidth: isDesktop ? 720 : undefined, alignSelf: 'center', width: '100%' }}>

        {/* Balance Card */}
        <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 28 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#ffffff70', marginBottom: 6 }}>Available Balance</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 44, color: colors.primary, lineHeight: 52 }}>
            ${(summary?.total_revenue ?? 0).toFixed(2)}
          </Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#ffffff60', marginBottom: 24 }}>
            Next auto-payout on the 1st of next month
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => Alert.alert('Request Payout', 'Your payout request will be processed within 2–3 business days to your registered bank account.')}
              style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#222022' }}>Request Payout</Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Add Bank', 'Go to Store Settings → Payout Settings to add or update your bank account details.')}
              style={{ flex: 1, backgroundColor: '#ffffff18', paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff20' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>Add Bank</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { label: 'This Month', value: `$${(summary?.revenue_this_month ?? 0).toFixed(2)}`, icon: 'trending-up', color: colors.success },
            { label: 'Total Earned', value: `$${(summary?.total_revenue ?? 0).toFixed(2)}`, icon: 'wallet', color: colors.primaryDim },
            { label: 'Commission', value: '8%', icon: 'receipt', color: colors.warning },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.surfaceMuted, alignItems: 'center' }}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} style={{ marginBottom: 6 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{stat.value}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Bank Account */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 14 }}>Payout Account</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="business" size={22} color={colors.primaryDim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>GCB Bank Ghana</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost }}>•••• •••• •••• 4201</Text>
            </View>
            <Pressable
              onPress={() => Alert.alert('Change Bank Account', 'Go to Store Settings → Payout Settings to update your bank account details.')}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>Change</Text>
            </Pressable>
          </View>
        </View>

        {/* History */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14 }}>Payout History</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
            {PAYOUT_HISTORY.map((p, i) => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < PAYOUT_HISTORY.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceMuted }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: p.status === 'completed' ? colors.successGhost : colors.warningGhost, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name={p.status === 'completed' ? 'checkmark-circle' : 'time'} size={22} color={p.status === 'completed' ? colors.success : colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>#{p.id}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>{p.date} · {p.method}</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>${p.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
