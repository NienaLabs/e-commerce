import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/Button';

function Field({ label, placeholder, value, onChangeText, colors }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkGhost}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: colors.surfaceSoft,
          borderRadius: 14,
          paddingHorizontal: 16,
          height: 52,
          fontFamily: 'OpenSans_400Regular',
          fontSize: 15,
          color: colors.ink,
          borderWidth: 1.5,
          borderColor: focused ? colors.ink : colors.surfaceMuted,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
      />
    </View>
  );
}

const OPERATING_HOURS = ['Mon–Fri', 'Mon–Sat', 'Mon–Sun', 'Weekends Only'];

export default function BusinessSettingsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [form, setForm] = useState({
    phone: '+233 55 000 1234',
    email: 'hello@soundwave.com',
    address: '14 Tech Avenue, Accra, Ghana',
    hours: 'Mon–Fri',
    tin: 'TIN-987654',
    regNum: 'BN-2024-12345',
  });
  const [saved, setSaved] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Business Details</Text>
        {saved && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
            <Ionicons name="checkmark-circle" size={15} color="#15803d" style={{ marginRight: 4 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#15803d' }}>Saved</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%', gap: 4, paddingBottom: 60 }}>
        
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="information-circle" size={20} color={colors.info} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Verified Business</Text>
          </View>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>
            Your business details are verified. If you need to change your TIN or Registration Number, please contact support.
          </Text>
        </View>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14 }}>Legal Details</Text>
        <Field label="Tax Identification Number (TIN)" placeholder="TIN" value={form.tin} onChangeText={() => {}} colors={colors} />
        <Field label="Business Registration Number" placeholder="Reg Number" value={form.regNum} onChangeText={() => {}} colors={colors} />

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14, marginTop: 8 }}>Contact & Location</Text>
        <Field label="Contact Phone" placeholder="+233 55 000 1234" value={form.phone} onChangeText={(v: string) => setForm(f => ({ ...f, phone: v }))} colors={colors} />
        <Field label="Contact Email" placeholder="hello@yourstore.com" value={form.email} onChangeText={(v: string) => setForm(f => ({ ...f, email: v }))} colors={colors} />
        <Field label="Store Address" placeholder="Physical address" value={form.address} onChangeText={(v: string) => setForm(f => ({ ...f, address: v }))} colors={colors} />

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14, marginTop: 8 }}>Operating Hours</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {OPERATING_HOURS.map(h => (
            <Pressable
              key={h}
              onPress={() => setForm(f => ({ ...f, hours: h }))}
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: form.hours === h ? colors.ink : colors.surfaceSoft, borderWidth: 1.5, borderColor: form.hours === h ? colors.ink : colors.surfaceMuted }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: form.hours === h ? colors.surface : colors.inkSoft }}>{h}</Text>
            </Pressable>
          ))}
        </View>

        <Button title="Save Changes" onPress={() => setSaved(true)} />
      </ScrollView>
    </View>
  );
}
