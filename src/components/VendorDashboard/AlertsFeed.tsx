import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

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

export const AlertsFeed: React.FC<Props> = ({ alerts, loading }) => {
  const { colors } = useTheme();

  if (loading) {
    return <Text style={{ color: colors.inkMuted }}>Checking for anomalies...</Text>;
  }

  if (alerts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
        <Text style={[styles.emptyText, { color: colors.ink }]}>No anomalies detected recently. Everything looks stable!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.ink }]}>Alerts & Anomalies</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {alerts.map((alert, index) => {
          const isDrop = alert.z_score < 0;
          return (
            <View key={index} style={[styles.alertCard, { backgroundColor: isDrop ? '#fee2e2' : '#dcfce7' }]}>
              <Ionicons 
                name={isDrop ? "trending-down" : "trending-up"} 
                size={24} 
                color={isDrop ? '#ef4444' : '#22c55e'} 
              />
              <View style={styles.textContainer}>
                <Text style={styles.alertTitle}>
                  {isDrop ? 'Revenue Drop' : 'Revenue Spike'}
                </Text>
                <Text style={styles.alertDescription}>
                  Product {alert.product_id.substring(0, 8)}... {isDrop ? 'dropped' : 'spiked'} with a z-score of {alert.z_score.toFixed(1)}. Revenue: ${alert.revenue.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 320,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#4b5563',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
