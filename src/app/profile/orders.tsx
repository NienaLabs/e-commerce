import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

const MOCK_ORDERS = [
  { id: 'ORD-2918', date: 'May 24, 2026', total: 149.99, status: 'Delivered', items: 2 },
  { id: 'ORD-2844', date: 'May 10, 2026', total: 320.50, status: 'Processing', items: 1 },
];

export default function OrdersScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>My Orders</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 16 }}>
        {MOCK_ORDERS.length > 0 ? MOCK_ORDERS.map(order => (
          <View key={order.id} style={{ 
            backgroundColor: '#ffffff', borderRadius: 20, padding: 20, 
            borderWidth: 1, borderColor: '#eceae6',
            shadowColor: '#222022', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>{order.id}</Text>
              <View style={{ 
                backgroundColor: order.status === 'Delivered' ? '#2d9e5f18' : '#d4820a18',
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12
              }}>
                <Text style={{ 
                  fontFamily: 'Inter_600SemiBold', fontSize: 12, 
                  color: order.status === 'Delivered' ? '#2d9e5f' : '#d4820a' 
                }}>{order.status}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', marginBottom: 4 }}>Date: {order.date}</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', marginBottom: 16 }}>Items: {order.items}</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eceae6' }}>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b' }}>Total</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#222022' }}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        )) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Ionicons name="cube-outline" size={80} color="#eceae6" style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#222022' }}>No orders yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
