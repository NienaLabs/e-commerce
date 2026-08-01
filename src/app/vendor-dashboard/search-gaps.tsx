import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { getVendorMe, getVendorDashboardSearchGaps } from '../../api/vendors';
import { Header, ScreenBody, Card, Badge, EmptyState, Divider, font } from '../../components/vendor/kit';

export default function SearchGapsReport() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);

  const { data: vendor } = useQuery({ queryKey: ['vendor-me'], queryFn: () => getVendorMe(token!), enabled: !!token });
  const { data: gaps, isLoading } = useQuery({
    queryKey: ['vendor-search-gaps', vendor?.id],
    queryFn: () => getVendorDashboardSearchGaps(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <Header title="What shoppers want" subtitle="Demand you're not selling for yet" onBack={() => router.push('/vendor-dashboard' as any)} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !gaps || gaps.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="search-outline"
            title="Nothing to flag right now"
            body="We couldn't spot popular searches in your category going unmet at the moment. Check back as shopping trends change."
          />
        </View>
      ) : (
        <ScreenBody maxWidth={720}>
          <Card style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.infoGhost, borderColor: colors.infoGhost }}>
            <View style={{ marginTop: 1 }}>
              <Badge label="Opportunity" tone="info" icon="bulb-outline" />
            </View>
            <Text style={{ flex: 1, fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>
              These are things shoppers in your category search for often, but rarely end up buying — usually because no one
              stocks a good match. Adding products for these could win you sales with little competition.
            </Text>
          </Card>

          <Card padded={false}>
            {gaps.map((gap, i) => {
              const buyRate = (gap.avg_conversion_rate || 0) * 100;
              return (
                <View key={i}>
                  {i > 0 && <Divider />}
                  <View style={{ padding: 16, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ flex: 1, fontFamily: font.labelL, fontSize: 15, color: colors.ink, textTransform: 'capitalize' }} numberOfLines={2}>
                        “{gap.query_normalized}”
                      </Text>
                      <Badge label="Gap" tone="warning" />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                      <View>
                        <Text style={{ fontFamily: font.bold, fontSize: 18, color: colors.ink }}>{gap.search_count.toLocaleString()}</Text>
                        <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 1 }}>searches</Text>
                      </View>
                      <View>
                        <Text style={{ fontFamily: font.bold, fontSize: 18, color: buyRate < 2 ? colors.warning : colors.ink }}>{buyRate.toFixed(1)}%</Text>
                        <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 1 }}>lead to a sale</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        </ScreenBody>
      )}
    </SafeAreaView>
  );
}
