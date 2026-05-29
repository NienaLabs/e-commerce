import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

const MOCK_CARDS = [
  { id: '1', type: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
  { id: '2', type: 'Mastercard', last4: '8888', expiry: '04/27', isDefault: false },
];

export default function PaymentsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Payment Methods</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ gap: 16 }}>
          {MOCK_CARDS.map(card => (
            <View key={card.id} style={{ 
              backgroundColor: '#ffffff', borderRadius: 20, padding: 20, 
              borderWidth: 1, borderColor: card.isDefault ? '#c3d809' : '#eceae6',
              shadowColor: '#222022', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card" size={24} color="#222022" style={{ marginRight: 12 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>{card.type} •••• {card.last4}</Text>
                </View>
                {card.isDefault && (
                  <View style={{ backgroundColor: '#c3d80920', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#7a8a05', textTransform: 'uppercase' }}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b' }}>Expires {card.expiry}</Text>
            </View>
          ))}

          <Pressable style={({ pressed }) => [{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? '#f5f5f0' : '#ffffff',
            padding: 20, borderRadius: 20,
            borderWidth: 1, borderColor: '#eceae6', borderStyle: 'dashed',
            marginTop: 8
          }]}>
            <Ionicons name="add" size={20} color="#222022" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#222022' }}>Add New Payment Method</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
