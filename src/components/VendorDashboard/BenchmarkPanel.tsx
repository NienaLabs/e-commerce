import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

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

export const BenchmarkPanel: React.FC<Props> = ({ data, loading }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerTitle}>
          <Ionicons name="bar-chart-outline" size={20} color={colors.ink} />
          <Text style={[styles.title, { color: colors.ink }]}>Category Benchmark Insights</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.inkMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.content, { borderTopColor: colors.surfaceMuted }]}>
          {!data?.available ? (
            <Text style={{ color: colors.inkMuted, fontStyle: 'italic' }}>
              {data?.reason === 'insufficient_data' 
                ? 'Not enough vendors in your category to provide statistically meaningful and anonymous benchmarks.' 
                : 'Benchmark data is currently unavailable.'}
            </Text>
          ) : (
            <View style={styles.metricsContainer}>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.inkMuted }]}>Your Conversion Rate</Text>
                <Text style={[styles.metricValue, { color: colors.primary, fontWeight: 'bold' }]}>
                  {((data.your_conversion_rate || 0) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.inkMuted }]}>Category Average</Text>
                <Text style={[styles.metricValue, { color: colors.ink }]}>
                  {((data.category_avg_conversion_rate || 0) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.inkMuted }]}>Top Quartile (Top 25%)</Text>
                <Text style={[styles.metricValue, { color: '#fbbf24' }]}>
                  {((data.category_top_quartile_conversion_rate || 0) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    borderTopWidth: 1,
  },
  metricsContainer: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
