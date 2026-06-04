import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorMe, updateVendor } from '../../../api/vendors';

function Field({ label, placeholder, value, onChangeText, colors, multiline = false }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkGhost}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: colors.surfaceSoft,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 0,
          height: multiline ? 110 : 52,
          fontFamily: 'OpenSans_400Regular',
          fontSize: 15,
          color: colors.ink,
          borderWidth: 1.5,
          borderColor: focused ? colors.ink : colors.surfaceMuted,
          textAlignVertical: multiline ? 'top' : 'center',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
      />
    </View>
  );
}

export default function GeneralSettingsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ storeName: '', storeSlug: '', bio: '' });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => getVendorMe(token!),
    enabled: !!token,
  });

  // Pre-populate form once vendor data loads
  useEffect(() => {
    if (vendor) {
      setForm({
        storeName: vendor.store_name,
        storeSlug: vendor.store_slug,
        bio: vendor.bio ?? '',
      });
    }
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: () =>
      updateVendor(token!, vendor!.id, {
        store_name: form.storeName,
        store_slug: form.storeSlug,
        bio: form.bio,
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
      showToast('Store details saved successfully!', 'success');
      setTimeout(() => setSaved(false), 3000);
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
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>General Information</Text>
        {saved && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
            <Ionicons name="checkmark-circle" size={15} color="#15803d" style={{ marginRight: 4 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#15803d' }}>Saved</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%', gap: 4, paddingBottom: 60 }}>
          
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14 }}>Brand Assets</Text>
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
            <Pressable style={{ width: 100, height: 100, borderRadius: 20, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary }}>
              <Ionicons name="image-outline" size={28} color={colors.primaryDim} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.primaryDim, marginTop: 6 }}>Logo</Text>
            </Pressable>
            <Pressable style={{ flex: 1, height: 100, borderRadius: 20, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted }}>
              <Ionicons name="image-outline" size={28} color={colors.inkGhost} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.inkGhost, marginTop: 6 }}>Banner Image</Text>
            </Pressable>
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14 }}>Store Details</Text>
          <Field label="Store Name" placeholder="Your store name" value={form.storeName} onChangeText={(v: string) => setForm(f => ({ ...f, storeName: v }))} colors={colors} />
          <Field label="Store URL Slug" placeholder="your-store" value={form.storeSlug} onChangeText={(v: string) => setForm(f => ({ ...f, storeSlug: v }))} colors={colors} />
          <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>
              Your store URL: <Text style={{ color: colors.primaryDim, fontFamily: 'Inter_600SemiBold' }}>electric.app/vendor/{form.storeSlug}</Text>
            </Text>
          </View>
          <Field label="Store Bio" placeholder="Tell customers about your store..." value={form.bio} onChangeText={(v: string) => setForm(f => ({ ...f, bio: v }))} colors={colors} multiline />

          <Button 
            title={mutation.isPending ? 'Saving...' : 'Save Changes'} 
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending || !vendor}
          />
        </ScrollView>
      )}
    </View>
  );
}
