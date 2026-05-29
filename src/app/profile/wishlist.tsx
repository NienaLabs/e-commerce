import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

export default function WishlistScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Wishlist</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <Ionicons name="heart-outline" size={80} color="#eceae6" style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#222022', marginBottom: 8 }}>Your wishlist is empty</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', textAlign: 'center', maxWidth: 240 }}>
            Save items you love and they will show up here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
