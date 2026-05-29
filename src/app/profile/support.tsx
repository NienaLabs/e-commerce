import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

export default function SupportScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Help & Support</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        
        <View style={{ backgroundColor: '#222022', borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#ffffff', marginBottom: 8 }}>Need Help?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#9e9c9e', marginBottom: 20 }}>Our support team is available 24/7 to assist you.</Text>
          <Pressable style={{ backgroundColor: '#c3d809', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#222022' }}>Contact Support</Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#222022', marginBottom: 16 }}>FAQ</Text>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#eceae6', padding: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#222022', marginBottom: 8 }}>How do I track my order?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', marginBottom: 20, lineHeight: 22 }}>You can track your order by going to the 'My Orders' section and tapping on your current order to see real-time updates.</Text>
          
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#222022', marginBottom: 8 }}>What is your return policy?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', lineHeight: 22 }}>We offer a 30-day money-back guarantee on all our products. Please ensure items are in their original condition.</Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
