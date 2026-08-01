import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorMe, updateVendor } from '../../../api/vendors';
import { Header, ScreenBody, Section, Card, Field, Chip, Btn, font } from '../../../components/vendor/kit';

const OPERATING_HOURS = ['Mon–Fri', 'Mon–Sat', 'Mon–Sun', 'Weekends only'];

export default function BusinessSettingsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ phone: '', email: '', address: '', hours: 'Mon–Fri' });

  const { data: vendor, isLoading } = useQuery({ queryKey: ['vendor-me'], queryFn: () => getVendorMe(token!), enabled: !!token });

  useEffect(() => {
    if (vendor) {
      setForm(f => ({
        ...f,
        phone: (vendor as any).contact_phone ?? '',
        email: (vendor as any).contact_email ?? '',
        address: (vendor as any).store_address ?? '',
      }));
    }
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: () =>
      updateVendor(token!, vendor!.id, {
        ...(form.phone && ({ contact_phone: form.phone } as any)),
        ...(form.email && ({ contact_email: form.email } as any)),
        ...(form.address && ({ store_address: form.address } as any)),
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendor-me'] }); showToast('Business details saved!', 'success'); },
    onError: (error: any) => showToast(`Failed to save: ${error.message}`, 'error'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header title="Business details" subtitle="Contact info and hours" onBack={() => router.back()} hideBackOnDesktop={false} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScreenBody maxWidth={720}>
          <Card style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.surfaceSoft }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.inkMuted} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.labelL, fontSize: 14, color: colors.ink }}>Verified legal details are locked</Text>
              <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 3, lineHeight: 18 }}>
                Your TIN and business registration number can't be changed after verification. Contact support if they need updating.
              </Text>
            </View>
          </Card>

          <Section title="Store name">
            <Card style={{ paddingBottom: 2 }}>
              <Field label="Store name" value={vendor?.store_name ?? ''} editable={false} hint="Change this under General information." />
            </Card>
          </Section>

          <Section title="Contact & location" caption="How customers and couriers can reach your store.">
            <Card style={{ paddingBottom: 2 }}>
              <Field label="Contact phone" placeholder="+233 55 000 1234" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" leadingIcon="call-outline" />
              <Field label="Contact email" placeholder="hello@yourstore.com" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" leadingIcon="mail-outline" />
              <Field label="Store address" placeholder="Physical address" value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} leadingIcon="location-outline" />
            </Card>
          </Section>

          <Section title="Operating hours">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {OPERATING_HOURS.map(h => (
                <Chip key={h} label={h} active={form.hours === h} onPress={() => setForm(f => ({ ...f, hours: h }))} />
              ))}
            </View>
          </Section>

          <Btn title={mutation.isPending ? 'Saving…' : 'Save changes'} loading={mutation.isPending} onPress={() => mutation.mutate()} fullWidth />
        </ScreenBody>
      )}
    </View>
  );
}
