import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

function SettingsRow({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingRight: 16, paddingLeft: 8,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
        backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={icon} size={18} color={colors.primaryDim} />
      </View>
      <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
    </Pressable>
  );
}

export default function StoreSettingsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        {!isDesktop && (
          <Pressable onPress={() => router.push('/vendor-dashboard' as any)} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
        )}
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Store Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%', gap: 24, paddingBottom: 60 }}>
        
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            Store Configuration
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, paddingLeft: 8, overflow: 'hidden' }}>
            <SettingsRow icon="storefront" title="General Information" onPress={() => router.push('/vendor-dashboard/settings/general' as any)} />
            <SettingsRow icon="briefcase" title="Business Details" onPress={() => router.push('/vendor-dashboard/settings/business' as any)} />
            <View style={{ borderBottomWidth: 0 }}>
              <SettingsRow icon="wallet" title="Payout Settings" onPress={() => router.push('/vendor-dashboard/payouts' as any)} />
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            Preferences
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, paddingLeft: 8, overflow: 'hidden' }}>
            <SettingsRow icon="notifications" title="Notifications" onPress={() => router.push('/vendor-dashboard/settings/notifications' as any)} />
            <View style={{ borderBottomWidth: 0 }}>
              <SettingsRow icon="color-palette" title="Appearance" onPress={() => router.push('/vendor-dashboard/settings/appearance' as any)} />
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            Support
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, paddingLeft: 8, overflow: 'hidden' }}>
            <View style={{ borderBottomWidth: 0 }}>
              <SettingsRow icon="help-buoy" title="Help & Support" onPress={() => router.push('/vendor-dashboard/settings/support' as any)} />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
