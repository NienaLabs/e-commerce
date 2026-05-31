import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

export default function AppearanceSettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Appearance</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: 640, alignSelf: 'center', width: '100%', gap: 24 }}>
        
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Theme</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            
            <Pressable onPress={() => setThemeMode('light')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sunny-outline" size={20} color={colors.ink} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Light Theme</Text>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>

            <Pressable onPress={() => setThemeMode('dark')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="moon-outline" size={20} color={colors.ink} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Dark Theme</Text>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>

            <Pressable onPress={() => setThemeMode('system')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.ink} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>System Default</Text>
              </View>
              {themeMode === 'system' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>

          </View>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 12, marginHorizontal: 8 }}>
            System default will automatically match your device's dark or light mode setting.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
