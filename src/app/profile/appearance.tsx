import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';

export default function AppearanceScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  const renderOption = (value: ThemeMode, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <Pressable
      onPress={() => setThemeMode(value)}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: themeMode === value ? colors.primaryGhost : colors.surfaceSoft,
        alignItems: 'center', justifyContent: 'center', marginRight: 16
      }}>
        <Ionicons name={icon} size={20} color={themeMode === value ? colors.primaryDim : colors.inkMuted} />
      </View>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, flex: 1 }}>{label}</Text>
      {themeMode === value && <Ionicons name="checkmark" size={24} color={colors.primary} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Appearance</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
          {renderOption('light', 'Light Mode', 'sunny')}
          {renderOption('dark', 'Dark Mode', 'moon')}
          {renderOption('system', 'System Default', 'phone-portrait')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
