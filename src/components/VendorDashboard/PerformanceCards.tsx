import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

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

export const PerformanceCards: React.FC<Props> = ({ data, loading }) => {
  const { colors } = useTheme();
  
  if (loading || !data) {
    return <Text style={{ color: colors.inkMuted }}>Loading performance...</Text>;
  }

  const cards = [
    { title: 'Revenue', value: `$${data.total_revenue.toFixed(2)}`, icon: 'cash-outline', color: '#4ade80' },
    { title: 'Units Sold', value: data.total_units, icon: 'cube-outline', color: '#60a5fa' },
    { title: 'Orders', value: data.total_orders, icon: 'cart-outline', color: '#f472b6' },
    { title: 'AOV', value: `$${data.aov.toFixed(2)}`, icon: 'pricetag-outline', color: '#fbbf24' },
  ];

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
            <Ionicons name={card.icon as any} size={24} color={card.color} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.inkMuted }]}>{card.title}</Text>
            <Text style={[styles.value, { color: colors.ink }]}>{card.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
