import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';

export default function AppearanceScreen() {
  const [theme, setTheme] = useState('system');

  const renderOption = (value: string, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <Pressable
      onPress={() => setTheme(value)}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eceae6' }}
    >
      <View style={{ 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: theme === value ? '#c3d80920' : '#f5f5f0', 
        alignItems: 'center', justifyContent: 'center', marginRight: 16 
      }}>
        <Ionicons name={icon} size={20} color={theme === value ? '#7a8a05' : '#6b696b'} />
      </View>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#222022', flex: 1 }}>{label}</Text>
      {theme === value && <Ionicons name="checkmark" size={24} color="#c3d809" />}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>
      <WebHeader />
      
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color="#222022" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022' }}>Appearance</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#eceae6', overflow: 'hidden' }}>
          {renderOption('light', 'Light Mode', 'sunny')}
          {renderOption('dark', 'Dark Mode', 'moon')}
          {renderOption('system', 'System Default', 'phone-portrait')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
