import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorMe, updateVendor } from '../../../api/vendors';

function Field({ label, placeholder, value, onChangeText, colors, editable = true }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkGhost}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: editable ? colors.surfaceSoft : colors.surfaceMuted,
          borderRadius: 14,
          paddingHorizontal: 16,
          height: 52,
          fontFamily: 'OpenSans_400Regular',
          fontSize: 15,
          color: editable ? colors.ink : colors.inkGhost,
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
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
    hours: 'Mon–Fri',
  });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => getVendorMe(token!),
    enabled: !!token,
  });

  // Pre-populate from vendor data once loaded
  useEffect(() => {
    if (vendor) {
      setForm(f => ({
        ...f,
        // Use bio-extracted contact info if we stored it there, else use store_name as fallback
        phone: (vendor as any).contact_phone ?? '',
        email: (vendor as any).contact_email ?? '',
        address: (vendor as any).store_address ?? '',
      }));
    }
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: () =>
      updateVendor(token!, vendor!.id, {
        // Store contact fields in extra metadata — backend will need to support these
        ...(form.phone && { contact_phone: form.phone } as any),
        ...(form.email && { contact_email: form.email } as any),
        ...(form.address && { store_address: form.address } as any),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
      showToast('Business details saved!', 'success');
    },
    onError: (error: any) => {
      showToast(`Failed to save: ${error.message}`, 'error');
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Business Details</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%', gap: 4, paddingBottom: 60 }}>

          {/* Locked legal section */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="lock-closed" size={18} color={colors.inkGhost} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Verified Legal Details</Text>
            </View>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>
              Your TIN and Business Registration Number are locked after verification. Contact support to update these.
            </Text>
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14, marginTop: 8 }}>Store Name</Text>
          <Field label="Store Name" placeholder="Your store name" value={vendor?.store_name ?? ''} onChangeText={() => {}} colors={colors} editable={false} />

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

          <Button
            title={mutation.isPending ? 'Saving...' : 'Save Changes'}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          />
        </ScrollView>
      )}
    </View>
  );
}
