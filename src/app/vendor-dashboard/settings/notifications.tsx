import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

function ToggleRow({ title, description, value, onValueChange, colors }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>{title}</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#ffffff' : (value ? '#ffffff' : '#f4f3f4')}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    newOrdersApp: true,
    newOrdersEmail: true,
    newOrdersSms: false,
    payoutApp: true,
    payoutEmail: true,
    messagesApp: true,
    messagesEmail: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Notifications</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: 640, alignSelf: 'center', width: '100%', gap: 24, paddingBottom: 60 }}>
        
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Orders</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <ToggleRow title="Push Notifications" description="Get notified on your device when a new order is placed." value={settings.newOrdersApp} onValueChange={() => toggle('newOrdersApp')} colors={colors} />
            <ToggleRow title="Email Alerts" description="Receive an email for every new order." value={settings.newOrdersEmail} onValueChange={() => toggle('newOrdersEmail')} colors={colors} />
            <View style={{ borderBottomWidth: 0 }}>
              <ToggleRow title="SMS Alerts" description="Get a text message for new orders." value={settings.newOrdersSms} onValueChange={() => toggle('newOrdersSms')} colors={colors} />
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Payouts</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <ToggleRow title="Push Notifications" description="When a payout is processed to your bank." value={settings.payoutApp} onValueChange={() => toggle('payoutApp')} colors={colors} />
            <View style={{ borderBottomWidth: 0 }}>
              <ToggleRow title="Email Summaries" description="Receive a monthly email summary of your payouts." value={settings.payoutEmail} onValueChange={() => toggle('payoutEmail')} colors={colors} />
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Customer Messages</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.surfaceMuted }}>
            <ToggleRow title="Push Notifications" description="When a customer sends you a direct message." value={settings.messagesApp} onValueChange={() => toggle('messagesApp')} colors={colors} />
            <View style={{ borderBottomWidth: 0 }}>
              <ToggleRow title="Email Alerts" description="When you have unread messages for more than 24 hours." value={settings.messagesEmail} onValueChange={() => toggle('messagesEmail')} colors={colors} />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
