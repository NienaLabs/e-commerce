import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Section, Card, Badge, Skeleton, font } from '../vendor/kit';

interface AlertData {
  day: string;
  product_id: string;
  revenue: number;
  z_score: number;
}

interface Props {
  alerts: AlertData[];
  loading: boolean;
}

const money = (n: number) => `GH₵ ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortId = (id: string) => `#${(id ?? '').slice(0, 6).toUpperCase()}`;
const prettyDay = (d: string) => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const AlertsFeed: React.FC<Props> = ({ alerts, loading }) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <Section title="Needs your attention">
        <Card style={{ gap: 12 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="55%" height={12} />
        </Card>
      </Section>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Section title="Needs your attention">
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.successGhost, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>Everything looks steady</Text>
            <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, marginTop: 2, lineHeight: 19 }}>
              No sudden jumps or drops in your sales lately. We'll let you know here the moment something changes.
            </Text>
          </View>
        </Card>
      </Section>
    );
  }

  return (
    <Section title="Needs your attention">
      <View style={{ gap: 12 }}>
        {alerts.map((alert, i) => {
          const isDrop = alert.z_score < 0;
          const tone = isDrop ? 'warning' : 'success';
          const iconBg = isDrop ? colors.warningGhost : colors.successGhost;
          const iconFg = isDrop ? colors.warning : colors.success;
          return (
            <Card key={i} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={isDrop ? 'trending-down-outline' : 'trending-up-outline'} size={20} color={iconFg} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>
                    {isDrop ? 'Sales dipped for a product' : 'A product is selling fast'}
                  </Text>
                  <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 1 }}>
                    Product {shortId(alert.product_id)} · {prettyDay(alert.day)}
                  </Text>
                </View>
                <Badge label={isDrop ? 'Review' : 'Good news'} tone={tone} />
              </View>
              <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>
                {isDrop
                  ? `This product earned ${money(alert.revenue)} on ${prettyDay(alert.day)} — noticeably below its usual pace. It's worth checking the price, stock level, and photos on the listing.`
                  : `This product earned ${money(alert.revenue)} on ${prettyDay(alert.day)} — well above its usual pace. Make sure it's well stocked, and consider featuring it while demand is high.`}
              </Text>
            </Card>
          );
        })}
      </View>
    </Section>
  );
};
