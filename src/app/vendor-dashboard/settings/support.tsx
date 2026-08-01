import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Header, ScreenBody, Section, Card, ListRow, font } from '../../../components/vendor/kit';

export default function SupportSettingsScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Header title="Guides & resources" subtitle="Learn how to sell more" onBack={() => router.back()} hideBackOnDesktop={false} />

      <ScreenBody maxWidth={720}>
        <Section title="Get in touch" caption="We're here to help when you're stuck.">
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card onPress={() => router.push('/vendor-dashboard/support' as any)} style={{ flex: 1, alignItems: 'center', gap: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={24} color={colors.primaryDim} />
              </View>
              <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>Open a ticket</Text>
              <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, textAlign: 'center' }}>Chat with our team</Text>
            </Card>
            <Card onPress={() => Linking.openURL('mailto:support@nienalabs.com')} style={{ flex: 1, alignItems: 'center', gap: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.infoGhost, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mail-outline" size={24} color={colors.info} />
              </View>
              <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>Email us</Text>
              <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, textAlign: 'center' }}>Usually replies in 2h</Text>
            </Card>
          </View>
        </Section>

        <Section title="Resources">
          <Card padded={false}>
            <ListRow icon="book-outline" title="Vendor guide" subtitle="Everything you need to run your store" onPress={() => {}} />
            <ListRow icon="shield-checkmark-outline" title="Platform policies" subtitle="The rules every store follows" onPress={() => {}} />
            <ListRow icon="bulb-outline" title="Tips for selling" subtitle="Practical ways to win more sales" onPress={() => {}} last />
          </Card>
        </Section>
      </ScreenBody>
    </View>
  );
}
