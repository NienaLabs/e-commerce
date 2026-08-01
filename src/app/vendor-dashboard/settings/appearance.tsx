import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, type ThemeMode } from '../../../theme/ThemeContext';
import { Header, ScreenBody, Section, Card, Divider, font } from '../../../components/vendor/kit';

const OPTIONS: { mode: ThemeMode; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { mode: 'light', icon: 'sunny-outline', label: 'Light', desc: 'Bright surfaces — the default look.' },
  { mode: 'dark', icon: 'moon-outline', label: 'Dark', desc: 'Easier on the eyes in low light.' },
  { mode: 'system', icon: 'phone-portrait-outline', label: 'Match device', desc: "Follow your phone's light or dark setting." },
];

export default function AppearanceSettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header title="Appearance" subtitle="How the dashboard looks" onBack={() => router.back()} hideBackOnDesktop={false} />

      <ScreenBody maxWidth={720}>
        <Section title="Theme" caption="Pick the look you prefer for the vendor dashboard.">
          <Card padded={false}>
            {OPTIONS.map((opt, i) => {
              const active = themeMode === opt.mode;
              return (
                <View key={opt.mode}>
                  {i > 0 && <Divider />}
                  <Pressable
                    onPress={() => setThemeMode(opt.mode)}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: pressed ? colors.surfaceSoft : 'transparent' })}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: active ? colors.primaryGhost : colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={opt.icon} size={19} color={active ? colors.primaryDim : colors.inkSoft} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }}>{opt.label}</Text>
                      <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }}>{opt.desc}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={22} color={colors.primaryDim} />}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </Section>
      </ScreenBody>
    </View>
  );
}
