import React from 'react';
import { View } from 'react-native';
import { Section, StatGrid, StatCard, Card, Skeleton } from '../vendor/kit';

interface PerformanceData {
  total_revenue: number;
  total_units: number;
  total_orders: number;
  aov: number;
}

interface Props {
  data: PerformanceData | null;
  loading: boolean;
}

const money = (n: number) => `GH₵ ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PerformanceCards: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Section title="Your store at a glance" caption="A quick read on how your store is performing right now.">
        <StatGrid>
          {[0, 1, 2, 3].map(i => (
            <Card key={i} style={{ gap: 10 }}>
              <Skeleton width={38} height={38} radius={11} />
              <Skeleton width={90} height={22} />
              <Skeleton width={70} height={12} />
            </Card>
          ))}
        </StatGrid>
      </Section>
    );
  }

  return (
    <Section title="Your store at a glance" caption="A quick read on how your store is performing right now.">
      <StatGrid>
        <StatCard
          icon="cash-outline"
          label="Revenue"
          value={money(data.total_revenue)}
          hint="Money earned from all paid orders."
        />
        <StatCard
          icon="cube-outline"
          label="Units sold"
          value={data.total_units.toLocaleString()}
          hint="Individual items customers bought."
        />
        <StatCard
          icon="bag-handle-outline"
          label="Orders"
          value={data.total_orders.toLocaleString()}
          hint="Completed customer orders."
        />
        <StatCard
          icon="pricetag-outline"
          label="Avg. order value"
          value={money(data.aov)}
          hint="What a typical order is worth."
        />
      </StatGrid>
    </Section>
  );
};
