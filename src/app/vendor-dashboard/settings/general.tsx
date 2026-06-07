import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorMe, updateVendor, deleteVendor } from '../../../api/vendors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

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
  const { token, refreshVendor } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [form, setForm] = useState({ 
    storeName: '', storeSlug: '', bio: '', 
    logoUrl: '', bannerUrl: '',
    latitude: null as number | null, 
    longitude: null as number | null 
  });

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
    onError: (error: any) => {
      showToast(`Failed to save: ${error.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(token!, vendor!.id),
    onSuccess: async () => {
      await refreshVendor(); // Remove vendor status from context
      queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
      showToast('Store deleted successfully.', 'success');
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      showToast(`Failed to delete store: ${error.message}`, 'error');
    }
  });

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete your store? This action cannot be undone and will delete all your products.')) {
        deleteMutation.mutate();
      }
    } else {
      Alert.alert(
        'Delete Store',
        'Are you sure you want to delete your store? This action cannot be undone and will delete all your products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
        ]
      );
    }
  };

  const pickImage = async (field: 'logoUrl' | 'bannerUrl') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'logoUrl' ? [1, 1] : [3, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm(prev => ({ ...prev, [field]: result.assets[0].uri }));
    }
  };

  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access location was denied', 'error');
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setForm(prev => ({ 
        ...prev, 
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude 
      }));
      showToast('Location updated!', 'success');
    } catch (error) {
      showToast('Failed to fetch location. Please try again.', 'error');
    } finally {
      setIsLocating(false);
    }
  };

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
            <Pressable onPress={() => pickImage('logoUrl')} style={{ width: 100, height: 100, borderRadius: 20, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, overflow: 'hidden' }}>
              {form.logoUrl ? (
                <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color={colors.primaryDim} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.primaryDim, marginTop: 6 }}>Logo</Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={() => pickImage('bannerUrl')} style={{ flex: 1, height: 100, borderRadius: 20, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
               {form.bannerUrl ? (
                <Image source={{ uri: form.bannerUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color={colors.inkGhost} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.inkGhost, marginTop: 6 }}>Banner Image</Text>
                </>
              )}
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

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink, marginBottom: 14, marginTop: 12 }}>Store Location (GPS)</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceMuted, padding: 16, marginBottom: 24 }}>
            {form.latitude && form.longitude ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="location" size={24} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Location Set</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>Lat: {form.latitude.toFixed(4)}, Lng: {form.longitude.toFixed(4)}</Text>
                </View>
                <Pressable onPress={fetchLocation} style={{ padding: 8 }}>
                  {isLocating ? <ActivityIndicator size="small" color={colors.primaryDim} /> : <Ionicons name="refresh" size={20} color={colors.primaryDim} />}
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={fetchLocation} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
                {isLocating ? (
                  <ActivityIndicator size="small" color={colors.primaryDim} />
                ) : (
                  <>
                    <Ionicons name="navigate-circle-outline" size={24} color={colors.primaryDim} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primaryDim }}>Fetch Current Location</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <Button 
            title={mutation.isPending ? 'Saving...' : 'Save Changes'} 
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending || !vendor}
          />

          {/* Danger Zone */}
          <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, paddingTop: 24 }}>
             <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.error, marginBottom: 8 }}>Danger Zone</Text>
             <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
               Deleting your store is permanent. All products, sales data, and store profile will be completely erased.
             </Text>
             <Pressable 
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.error : colors.errorGhost,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.error,
                  opacity: deleteMutation.isPending ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: deleteMutation.isPending ? colors.surface : colors.error }}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Store'}
                </Text>
             </Pressable>
          </View>

        </ScrollView>
      )}
    </View>
  );
}
