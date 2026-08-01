import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Header, ScreenBody, Section, Card, ToggleRow } from '../../../components/vendor/kit';

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    newOrdersApp: true, newOrdersEmail: true, newOrdersSms: false,
    payoutApp: true, payoutEmail: true,
    messagesApp: true, messagesEmail: false,
  });
  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header title="Notifications" subtitle="Choose what you're alerted about" onBack={() => router.back()} hideBackOnDesktop={false} />

      <ScreenBody maxWidth={720}>
        <Section title="Orders" caption="Stay on top of incoming orders so you can fulfil them quickly.">
          <Card padded={false}>
            <ToggleRow icon="phone-portrait-outline" title="Push notifications" description="A notification on your device for every new order." value={settings.newOrdersApp} onValueChange={() => toggle('newOrdersApp')} />
            <ToggleRow icon="mail-outline" title="Email alerts" description="An email whenever a new order is placed." value={settings.newOrdersEmail} onValueChange={() => toggle('newOrdersEmail')} />
            <ToggleRow icon="chatbox-outline" title="SMS alerts" description="A text message for new orders." value={settings.newOrdersSms} onValueChange={() => toggle('newOrdersSms')} last />
          </Card>
        </Section>

        <Section title="Payouts">
          <Card padded={false}>
            <ToggleRow icon="phone-portrait-outline" title="Push notifications" description="When a payout is sent to your bank." value={settings.payoutApp} onValueChange={() => toggle('payoutApp')} />
            <ToggleRow icon="mail-outline" title="Monthly email summary" description="A monthly recap of your payouts." value={settings.payoutEmail} onValueChange={() => toggle('payoutEmail')} last />
          </Card>
        </Section>

        <Section title="Customer messages">
          <Card padded={false}>
            <ToggleRow icon="phone-portrait-outline" title="Push notifications" description="When a customer messages you directly." value={settings.messagesApp} onValueChange={() => toggle('messagesApp')} />
            <ToggleRow icon="mail-outline" title="Email alerts" description="When messages stay unread for over 24 hours." value={settings.messagesEmail} onValueChange={() => toggle('messagesEmail')} last />
          </Card>
        </Section>
      </ScreenBody>
    </View>
  );
}
