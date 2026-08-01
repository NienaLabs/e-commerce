import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Section, Card, Skeleton, font } from '../vendor/kit';

interface BenchmarkData {
  available: boolean;
  reason?: string;
  your_conversion_rate?: number;
  category_avg_conversion_rate?: number;
  category_top_quartile_conversion_rate?: number;
}

interface Props {
  data: BenchmarkData | null;
  loading: boolean;
}

const pct = (n: number) => `${((n ?? 0) * 100).toFixed(1)}%`;

export const BenchmarkPanel: React.FC<Props> = ({ data, loading }) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <Section title="How you compare" caption="How your store stacks up against similar stores — always kept anonymous.">
        <Card style={{ gap: 14 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="100%" height={12} />
        </Card>
      </Section>
    );
  }

  if (!data?.available) {
    return (
      <Section title="How you compare" caption="How your store stacks up against similar stores — always kept anonymous.">
        <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.infoGhost, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people-outline" size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>Not enough data yet</Text>
            <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, marginTop: 3, lineHeight: 20 }}>
              {data?.reason === 'insufficient_data'
                ? "There aren't enough other stores in your category yet to make a fair, anonymous comparison. Check back as your category grows."
                : 'Comparison data is temporarily unavailable. Please check back a little later.'}
            </Text>
          </View>
        </Card>
      </Section>
    );
  }

  const you = data.your_conversion_rate ?? 0;
  const avg = data.category_avg_conversion_rate ?? 0;
  const top = data.category_top_quartile_conversion_rate ?? 0;
  const max = Math.max(you, avg, top, 0.0001);

  const rows = [
    { label: 'Your store', value: you, color: colors.primary, strong: true },
    { label: 'Typical store like yours', value: avg, color: colors.surfaceDeep, strong: false },
    { label: 'Best sellers in your category', value: top, color: colors.inkSoft, strong: false },
  ];

  const doingWell = you >= avg;

  return (
    <Section title="How you compare" caption="How your store stacks up against similar stores — always kept anonymous.">
      <Card style={{ gap: 16 }}>
        <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>
          This shows how often a shopper who views your products goes on to buy — compared with other stores in your
          category. {doingWell
            ? 'You’re at or above the typical store — nice work. Aim for the best-sellers line to grow further.'
            : 'You’re a little below the typical store. Clearer photos, sharper prices, and fuller descriptions usually help lift this.'}
        </Text>

        <View style={{ gap: 14 }}>
          {rows.map(row => (
            <View key={row.label} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: row.strong ? font.labelL : font.medium, fontSize: 13, color: row.strong ? colors.ink : colors.inkMuted }} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={{ fontFamily: font.bold, fontSize: 14, color: row.strong ? colors.ink : colors.inkMuted }}>
                  {pct(row.value)}
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceSoft, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(4, (row.value / max) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: row.color }} />
              </View>
            </View>
          ))}
        </View>

        <Text style={{ fontFamily: font.body, fontSize: 11.5, color: colors.inkGhost, lineHeight: 16 }}>
          “Visits that become orders” — the share of product views that end in a purchase.
        </Text>
      </Card>
    </Section>
  );
};
