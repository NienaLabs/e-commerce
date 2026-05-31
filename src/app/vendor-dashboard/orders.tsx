import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const ORDERS = [
  { id: 'EL-90120', customer: 'Ama Owusu', items: 2, amount: 149.99, status: 'new', date: 'May 31, 2026, 09:14 AM' },
  { id: 'EL-90119', customer: 'Kweku Asante', items: 1, amount: 59.99, status: 'packed', date: 'May 31, 2026, 08:52 AM' },
  { id: 'EL-90118', customer: 'Abena Darkwah', items: 3, amount: 299.00, status: 'shipped', date: 'May 30, 2026, 05:30 PM' },
  { id: 'EL-90117', customer: 'Kofi Boateng', items: 1, amount: 159.00, status: 'delivered', date: 'May 30, 2026, 12:00 PM' },
  { id: 'EL-90116', customer: 'Serwa Mensah', items: 2, amount: 89.98, status: 'delivered', date: 'May 29, 2026, 03:15 PM' },
  { id: 'EL-90115', customer: 'Yaw Darko', items: 1, amount: 199.99, status: 'cancelled', date: 'May 29, 2026, 11:00 AM' },
];



const FILTERS = ['All', 'New', 'Packed', 'Shipped', 'Delivered'];

export default function VendorOrdersScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [filter, setFilter] = useState('All');

  const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
    new: { label: 'New', bg: colors.infoGhost, text: colors.info },
    packed: { label: 'Packed', bg: colors.warningGhost, text: colors.warning },
    shipped: { label: 'Shipped', bg: colors.primaryGhost, text: colors.primaryDim },
    delivered: { label: 'Delivered', bg: colors.successGhost, text: colors.success },
    cancelled: { label: 'Cancelled', bg: colors.errorGhost, text: colors.error },
  };

  const filtered = filter === 'All' ? ORDERS : ORDERS.filter(o => o.status === filter.toLowerCase());

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        {!isDesktop && (
          <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
        )}
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Order Management</Text>
      </View>

      {/* Filter Tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, backgroundColor: colors.surfaceSoft }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ 
            paddingHorizontal: isDesktop ? 24 : 16, 
            paddingVertical: 16, 
            gap: 12 
          }}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={({ pressed }) => ({ 
                paddingHorizontal: 20, 
                paddingVertical: 10, 
                borderRadius: 24, 
                backgroundColor: filter === f ? colors.ink : (pressed ? colors.surfaceMuted : colors.surface), 
                borderWidth: 1, 
                borderColor: filter === f ? colors.ink : colors.surfaceMuted,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: filter === f ? 4 : 1 },
                shadowOpacity: filter === f ? (colors.isDark ? 0.3 : 0.15) : 0.05,
                shadowRadius: filter === f ? 8 : 2,
                elevation: filter === f ? 4 : 1,
              })}
            >
              <Text style={{ 
                fontFamily: filter === f ? 'Inter_700Bold' : 'Inter_600SemiBold', 
                fontSize: 14, 
                color: filter === f ? colors.surface : colors.inkSoft 
              }}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isDesktop ? 24 : 16, paddingBottom: 60, gap: 16 }}>
        {filtered.map(order => {
          const cfg = STATUS_CFG[order.status];
          return (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/vendor-dashboard/order/${order.id}` as any)}
              style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.surfaceMuted, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.2 : 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>#{order.id}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 2 }}>{order.date}</Text>
                </View>
                <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: cfg.text }}>{cfg.label}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: colors.surfaceMuted, marginBottom: 10 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>{order.customer}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{order.items} item{order.items > 1 ? 's' : ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>${order.amount.toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
