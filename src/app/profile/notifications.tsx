import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { pushPermissionStatus, requestPushPermission } = useNotifications();
  
  const isPushEnabled = pushPermissionStatus === 'granted';

  const handleTogglePush = async (newValue: boolean) => {
    if (newValue) {
      await requestPushPermission();
    } else {
      if (Platform.OS === 'web') {
        window.alert("To disable push notifications, please change your browser settings.");
      } else {
        Alert.alert(
          "Disable Notifications",
          "To disable push notifications, please change your device settings.",
          [{ text: "OK" }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Notifications</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 4 }}>Order Updates</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Get notified about your order status, shipping, and delivery.</Text>
            </View>
            <Switch
              value={isPushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 4 }}>Promotions & Deals</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Receive special offers, discounts, and exclusive deals.</Text>
            </View>
            <Switch
              value={isPushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
