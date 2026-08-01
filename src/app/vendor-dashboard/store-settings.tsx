import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Header, ScreenBody, Section, Card, ListRow } from '../../components/vendor/kit';

export default function StoreSettingsScreen() {
  const { colors } = useTheme();
  const go = (path: string) => router.push(path as any);

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header title="Store settings" subtitle="Manage your store and preferences" onBack={() => router.push('/vendor-dashboard' as any)} />

      <ScreenBody maxWidth={720}>
        <Section title="Your store" caption="The details customers see and what you owe the platform.">
          <Card padded={false}>
            <ListRow icon="storefront-outline" title="General information" subtitle="Store name, logo, banner and location" onPress={() => go('/vendor-dashboard/settings/general')} />
            <ListRow icon="briefcase-outline" title="Business details" subtitle="Contact info, address and operating hours" onPress={() => go('/vendor-dashboard/settings/business')} />
            <ListRow icon="receipt-outline" title="Commissions" subtitle="What you owe on your sales, and payment history" onPress={() => go('/vendor-dashboard/commissions')} last />
          </Card>
        </Section>

        <Section title="Preferences">
          <Card padded={false}>
            <ListRow icon="notifications-outline" title="Notifications" subtitle="Choose what you're alerted about" onPress={() => go('/vendor-dashboard/settings/notifications')} />
            <ListRow icon="color-palette-outline" title="Appearance" subtitle="Light, dark or match your device" onPress={() => go('/vendor-dashboard/settings/appearance')} last />
          </Card>
        </Section>

        <Section title="Help">
          <Card padded={false}>
            <ListRow icon="headset-outline" title="Contact support" subtitle="Message the platform team" onPress={() => go('/vendor-dashboard/support')} />
            <ListRow icon="help-buoy-outline" title="Guides & resources" subtitle="Tips for selling and platform policies" onPress={() => go('/vendor-dashboard/settings/support')} last />
          </Card>
        </Section>
      </ScreenBody>
    </View>
  );
}
