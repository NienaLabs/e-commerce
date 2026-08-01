import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorMe, updateVendor, deleteVendor } from '../../../api/vendors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Header, ScreenBody, Section, Card, Field, Btn, Badge, font } from '../../../components/vendor/kit';

export default function GeneralSettingsScreen() {
  const { colors } = useTheme();
  const { token, refreshVendor } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [form, setForm] = useState({
    storeName: '', storeSlug: '', bio: '', logoUrl: '', bannerUrl: '',
    latitude: null as number | null, longitude: null as number | null,
  });

  const { data: vendor, isLoading } = useQuery({ queryKey: ['vendor-me'], queryFn: () => getVendorMe(token!), enabled: !!token });

  useEffect(() => {
    if (vendor) {
      setForm({
        storeName: vendor.store_name,
        storeSlug: vendor.store_slug,
        bio: vendor.bio ?? '',
        logoUrl: vendor.logo_url ?? '',
        bannerUrl: vendor.banner_url ?? '',
        latitude: vendor.latitude ?? null,
        longitude: vendor.longitude ?? null,
      });
    }
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: () =>
      updateVendor(token!, vendor!.id, {
        store_name: form.storeName,
        store_slug: form.storeSlug,
        bio: form.bio,
        ...(form.logoUrl && { logo_url: form.logoUrl }),
        ...(form.bannerUrl && { banner_url: form.bannerUrl }),
        ...(form.latitude !== null && { latitude: form.latitude }),
        ...(form.longitude !== null && { longitude: form.longitude }),
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
      showToast('Store details saved successfully!', 'success');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error: any) => showToast(`Failed to save: ${error.message}`, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(token!, vendor!.id),
    onSuccess: async () => {
      await refreshVendor();
      queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
      showToast('Store deleted successfully.', 'success');
      router.replace('/(tabs)');
    },
    onError: (error: any) => showToast(`Failed to delete store: ${error.message}`, 'error'),
  });

  const handleDelete = () => {
    const msg = 'Delete your store? This is permanent and removes all your products and sales data.';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) deleteMutation.mutate();
    } else {
      Alert.alert('Delete store', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]);
    }
  };

  const pickImage = async (field: 'logoUrl' | 'bannerUrl') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'logoUrl' ? [1, 1] : [3, 1],
      quality: 0.8,
    });
    if (!result.canceled) setForm(prev => ({ ...prev, [field]: result.assets[0].uri }));
  };

  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { showToast('Permission to access location was denied', 'error'); setIsLocating(false); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setForm(prev => ({ ...prev, latitude: location.coords.latitude, longitude: location.coords.longitude }));
      showToast('Location updated!', 'success');
    } catch {
      showToast('Failed to fetch location. Please try again.', 'error');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }}>
      <Header
        title="General information"
        subtitle="Your store's public identity"
        onBack={() => router.back()}
        hideBackOnDesktop={false}
        right={saved ? <Badge label="Saved" tone="success" icon="checkmark-circle" /> : undefined}
      />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScreenBody maxWidth={720}>
          {/* Brand assets */}
          <Section title="Brand assets" caption="Your logo and banner appear on your storefront.">
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={() => pickImage('logoUrl')} style={{ width: 100, height: 100, borderRadius: 18, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, overflow: 'hidden' }}>
                {form.logoUrl ? <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
                  <><Ionicons name="image-outline" size={26} color={colors.primaryDim} /><Text style={{ fontFamily: font.labelM, fontSize: 11, color: colors.primaryDim, marginTop: 6 }}>Logo</Text></>
                )}
              </Pressable>
              <Pressable onPress={() => pickImage('bannerUrl')} style={{ flex: 1, height: 100, borderRadius: 18, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
                {form.bannerUrl ? <Image source={{ uri: form.bannerUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
                  <><Ionicons name="image-outline" size={26} color={colors.inkGhost} /><Text style={{ fontFamily: font.labelM, fontSize: 11, color: colors.inkGhost, marginTop: 6 }}>Banner image</Text></>
                )}
              </Pressable>
            </View>
          </Section>

          {/* Store details */}
          <Section title="Store details">
            <Card style={{ paddingBottom: 2 }}>
              <Field label="Store name" placeholder="Your store name" value={form.storeName} onChangeText={v => setForm(f => ({ ...f, storeName: v }))} />
              <Field label="Store URL slug" placeholder="your-store" value={form.storeSlug} onChangeText={v => setForm(f => ({ ...f, storeSlug: v }))} autoCapitalize="none" hint={`Your store link: nienalabs.com/vendor/${form.storeSlug || 'your-store'}`} />
              <Field label="Store bio" placeholder="Tell customers what your store is about…" value={form.bio} onChangeText={v => setForm(f => ({ ...f, bio: v }))} multiline />
            </Card>
          </Section>

          {/* Location */}
          <Section title="Store location" caption="Helps nearby shoppers find you and speeds up delivery.">
            <Card>
              {form.latitude && form.longitude ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.successGhost, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>Location set</Text>
                    <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 1 }}>Lat {form.latitude.toFixed(4)}, Lng {form.longitude.toFixed(4)}</Text>
                  </View>
                  <Pressable onPress={fetchLocation} hitSlop={8} style={{ padding: 8 }}>
                    {isLocating ? <ActivityIndicator size="small" color={colors.primaryDim} /> : <Ionicons name="refresh" size={20} color={colors.primaryDim} />}
                  </Pressable>
                </View>
              ) : (
                <Btn title={isLocating ? 'Fetching…' : 'Use my current location'} icon="navigate-outline" variant="secondary" loading={isLocating} onPress={fetchLocation} fullWidth />
              )}
            </Card>
          </Section>

          <Btn title={mutation.isPending ? 'Saving…' : 'Save changes'} loading={mutation.isPending} disabled={!vendor} onPress={() => mutation.mutate()} fullWidth />

          {/* Danger zone */}
          <Section title="Danger zone" caption="Deleting your store is permanent. Every product, sale and your store profile will be erased.">
            <Btn title={deleteMutation.isPending ? 'Deleting…' : 'Delete store'} icon="trash-outline" variant="destructive" loading={deleteMutation.isPending} onPress={handleDelete} fullWidth />
          </Section>
        </ScreenBody>
      )}
    </View>
  );
}
