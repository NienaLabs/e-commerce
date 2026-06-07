import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createVendor } from '../api/vendors';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const STEPS = [
  { key: 'store', label: 'Store Info', icon: 'storefront' },
  { key: 'media', label: 'Media & Location', icon: 'image' },
];

function StepIndicator({ current, colors }: { current: number; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
      {STEPS.map((step, idx) => (
        <React.Fragment key={step.key}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: idx <= current ? colors.ink : colors.surfaceSoft,
              borderWidth: idx === current ? 0 : 1.5,
              borderColor: idx < current ? colors.ink : colors.surfaceMuted,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {idx < current ? (
                <Ionicons name="checkmark" size={20} color={colors.surface} />
              ) : (
                <Ionicons name={step.icon as any} size={18} color={idx === current ? colors.surface : colors.inkGhost} />
              )}
            </View>
            <Text style={{ fontFamily: idx === current ? 'Inter_700Bold' : 'OpenSans_400Regular', fontSize: 11, color: idx <= current ? colors.ink : colors.inkGhost, marginTop: 6, textAlign: 'center', width: 80 }}>{step.label}</Text>
          </View>
          {idx < STEPS.length - 1 && (
            <View style={{ flex: 1, height: 2, backgroundColor: idx < current ? colors.ink : colors.surfaceMuted, marginHorizontal: 4, marginBottom: 24 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function Field({ label, placeholder, value, onChangeText, colors, multiline = false }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
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
          height: multiline ? 100 : 52,
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

export default function BecomeVendorScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token, refreshVendor } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    storeName: '', storeSlug: '', description: '',
    logoUrl: '', bannerUrl: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [isLocating, setIsLocating] = useState(false);

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
      showToast('Location accurately captured!', 'success');
    } catch (error) {
      showToast('Failed to fetch location. Please try again.', 'error');
    } finally {
      setIsLocating(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="checkmark-circle" size={52} color={colors.primaryDim} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink, marginBottom: 12, textAlign: 'center' }}>Application Submitted!</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
            We've received your vendor application. Our team will review it and get back to you within 2–3 business days.
          </Text>
          <View style={{ width: '100%', gap: 12 }}>
            <Button title="Go to Dashboard" onPress={() => router.replace('/vendor-dashboard' as any)} />
            <Pressable onPress={() => router.replace('/(tabs)')} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Back to Shopping</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => step > 0 ? setStep(s => s - 1) : router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Become a Vendor</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%' }}>

        {/* Stats Banner */}
        {step === 0 && (
          <View style={{ margin: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.ink }}>
            <View style={{ padding: 24 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.surface, marginBottom: 6 }}>Join 2,400+ Vendors</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#000000ff', lineHeight: 22 }}>
                Sell to thousands of customers across the platform. No listing fees. Pay only when you sell.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ffffff15', paddingVertical: 16 }}>
              {[['$2.4M', 'Monthly GMV'], ['12K+', 'Orders/Day'], ['0%', 'Listing Fee']].map(([val, lbl], i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#ffffff15' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.primary }}>{val}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: '#ffffff70', marginTop: 2 }}>{lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <StepIndicator current={step} colors={colors} />

        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>

          {/* Step 1 — Store Info */}
          {step === 0 && (
            <View>
              <Field label="Store Name *" placeholder="e.g. SoundWave Audio" value={form.storeName} onChangeText={(v: string) => setForm(f => ({ ...f, storeName: v }))} colors={colors} />
              <Field label="Store URL Slug *" placeholder="e.g. soundwave-audio" value={form.storeSlug} onChangeText={(v: string) => setForm(f => ({ ...f, storeSlug: v }))} colors={colors} />
              <Field label="Store Bio / Description *" placeholder="Tell customers what makes your store special..." value={form.description} onChangeText={(v: string) => setForm(f => ({ ...f, description: v }))} colors={colors} multiline />
            </View>
          )}

          {/* Step 2 — Media & Location */}
          {step === 1 && (
            <View>
              {/* Logo / Banner upload */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Store Logo</Text>
              <Pressable onPress={() => pickImage('logoUrl')} style={{ borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, padding: form.logoUrl ? 0 : 24, alignItems: 'center', marginBottom: 16, backgroundColor: colors.surfaceSoft, overflow: 'hidden', height: 120 }}>
                {form.logoUrl ? (
                  <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.inkGhost} style={{ marginBottom: 8 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Upload Logo</Text>
                  </>
                )}
              </Pressable>

              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Store Banner</Text>
              <Pressable onPress={() => pickImage('bannerUrl')} style={{ borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, padding: form.bannerUrl ? 0 : 24, alignItems: 'center', marginBottom: 24, backgroundColor: colors.surfaceSoft, overflow: 'hidden', height: 120 }}>
                {form.bannerUrl ? (
                  <Image source={{ uri: form.bannerUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.inkGhost} style={{ marginBottom: 8 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Upload Banner</Text>
                  </>
                )}
              </Pressable>

              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Store Location (GPS)</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceMuted, padding: 16, marginBottom: 24 }}>
                {form.latitude && form.longitude ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="location" size={24} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Location Captured</Text>
                      <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>Lat: {form.latitude.toFixed(4)}, Lng: {form.longitude.toFixed(4)}</Text>
                    </View>
                    <Pressable onPress={fetchLocation} style={{ padding: 8 }}>
                      <Ionicons name="refresh" size={20} color={colors.primaryDim} />
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
            </View>
          )}

          <Button
            title={step < 1 ? 'Continue' : 'Submit Application'}
            disabled={isSubmitting}
            onPress={async () => {
              if (step < 1) {
                if (!form.storeName || !form.storeSlug || !form.description) {
                  showToast('Please fill out all required fields.', 'warning');
                  return;
                }
                setStep(s => s + 1);
              } else {
                setIsSubmitting(true);
                try {
                  if (token) {
                    await createVendor(token, {
                      store_name: form.storeName,
                      store_slug: form.storeSlug,
                      bio: form.description,
                      ...(form.logoUrl && { logo_url: form.logoUrl }),
                      ...(form.bannerUrl && { banner_url: form.bannerUrl }),
                      ...(form.latitude !== null && { latitude: form.latitude }),
                      ...(form.longitude !== null && { longitude: form.longitude }),
                    });
                    
                    await refreshVendor();
                    await queryClient.invalidateQueries({ queryKey: ['vendor-me'] });
                    showToast('Vendor account created successfully!', 'success');
                    setSubmitted(true);
                  } else {
                    showToast('You must be logged in to register as a vendor.', 'error');
                  }
                } catch (e: any) {
                  showToast(e.message || 'Failed to create vendor account', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
