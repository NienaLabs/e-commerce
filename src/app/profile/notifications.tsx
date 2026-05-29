import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

export default function NotificationsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Notifications</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#eceae6', overflow: 'hidden' }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#222022', marginBottom: 4 }}>Order Updates</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#6b696b' }}>Get notified about your order status, shipping, and delivery.</Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: '#eceae6', true: '#c3d809' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#222022', marginBottom: 4 }}>Promotions & Deals</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: '#6b696b' }}>Receive special offers, discounts, and exclusive deals.</Text>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: '#eceae6', true: '#c3d809' }}
              thumbColor="#ffffff"
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
