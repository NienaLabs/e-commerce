import React, { useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { getVendorMe, getVendorDashboardSearchGaps } from '../../api/vendors';

export default function SearchGapsReport() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);

  const { data: vendor } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => getVendorMe(token!),
    enabled: !!token,
  });

  const { data: gaps, isLoading } = useQuery({
    queryKey: ['vendor-search-gaps', vendor?.id],
    queryFn: () => getVendorDashboardSearchGaps(token!, vendor!.id),
    enabled: !!token && !!vendor?.id,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceMuted }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Search Gaps Report</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !gaps || gaps.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.inkMuted} />
          <Text style={[styles.emptyText, { color: colors.inkMuted }]}>
            No significant search gaps detected at the moment.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={[styles.description, { color: colors.inkMuted }]}>
            These are queries customers are searching for in your category that yield low conversion rates. Stocking products for these searches represents an opportunity!
          </Text>

          <View style={[styles.tableContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceMuted }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.surfaceSoft }]}>
              <Text style={[styles.th, { color: colors.ink, flex: 2 }]}>Search Query</Text>
              <Text style={[styles.th, { color: colors.ink, flex: 1 }]}>Volume</Text>
              <Text style={[styles.th, { color: colors.ink, flex: 1 }]}>Conv. Rate</Text>
            </View>
            {gaps.map((gap, i) => (
              <View key={i} style={[styles.tableRow, { borderTopColor: colors.surfaceMuted }]}>
                <Text style={[styles.td, { color: colors.ink, flex: 2, fontWeight: '500' }]}>
                  {gap.query_normalized}
                </Text>
                <Text style={[styles.td, { color: colors.inkMuted, flex: 1 }]}>
                  {gap.search_count}
                </Text>
                <Text style={[styles.td, { color: colors.inkMuted, flex: 1 }]}>
                  {((gap.avg_conversion_rate || 0) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    paddingVertical: 16,
  },
  th: {
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  td: {
    fontSize: 14,
  },
});
