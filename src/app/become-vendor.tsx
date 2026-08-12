import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createVendor, getVendorRegistrationStatus } from '../api/vendors';
import { uploadFile } from '../api/upload';
import {
  VENDOR_TERMS,
  VENDOR_TERMS_VERSION,
  VENDOR_TERMS_IS_PLACEHOLDER,
} from '../constants/vendorTerms';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const STEPS = [
  { key: 'store', label: 'Store Info', icon: 'storefront' },
  { key: 'media', label: 'Media & Location', icon: 'image' },
  { key: 'terms', label: 'Terms', icon: 'document-text' },
];

const LAST_STEP = STEPS.length - 1;

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

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Whether the platform is accepting new vendors at all. `null` = still
  // checking, so the form isn't flashed up before we know.
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  // Terms gate: the agree control stays disabled until the vendor has actually
  // scrolled to the end, so "I agree" means they were at least shown all of it.
  const [termsScrolledToEnd, setTermsScrolledToEnd] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getVendorRegistrationStatus()
      .then(({ open }) => {
        if (!cancelled) setRegistrationOpen(open);
      })
      // If the check itself fails, don't block a legitimate vendor — the
      // backend enforces this properly on submit either way.
      .catch(() => {
        if (!cancelled) setRegistrationOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
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


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => step > 0 ? setStep(s => s - 1) : router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Become a Vendor</Text>
      </View>

      {/* Still checking whether registration is open. */}
      {registrationOpen === null && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryDim} />
        </View>
      )}

      {/* Registration closed by an admin. An explanation, not a failed submit. */}
      {registrationOpen === false && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceSoft,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.inkMuted} />
          </View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 22, color: colors.ink, textAlign: 'center' }}>
            Applications are closed
          </Text>
          <Text style={{
            fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted,
            textAlign: 'center', lineHeight: 22, marginTop: 12, maxWidth: 320,
          }}>
            We&apos;re not taking on new vendors at the moment. This is temporary — check
            back soon, or contact support if you think you should have access.
          </Text>
          <View style={{ height: 32 }} />
          <Button
            title="Back to profile"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)}
          />
        </View>
      )}

      {registrationOpen === true && (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ maxWidth: isDesktop ? 640 : undefined, alignSelf: 'center', width: '100%' }}>

        {/* Stats Banner */}
        {step === 0 && (
          <View style={{ margin: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.ink }}>
            <View style={{ padding: 24 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.surface, marginBottom: 6 }}>Join 2,400+ Vendors</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.surface, lineHeight: 22 }}>
                Sell to thousands of customers across the platform. No listing fees. Pay only when you sell.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ffffff15', paddingVertical: 16 }}>
              {[['$2.4M', 'Monthly GMV'], ['12K+', 'Orders/Day'], ['0%', 'Listing Fee']].map(([val, lbl], i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#ffffff15' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.primary }}>{val}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: `${colors.surface}b3`, marginTop: 2 }}>{lbl}</Text>
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

          {/* Step 3 — Terms & Conditions */}
          {step === 2 && (
            <View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 6 }}>
                Vendor terms
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, lineHeight: 20, marginBottom: 16 }}>
                Please read these before submitting. You&apos;ll need to scroll to the end
                to continue.
              </Text>

              {VENDOR_TERMS_IS_PLACEHOLDER && (
                <View style={{
                  flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12,
                  backgroundColor: colors.surfaceSoft, borderWidth: 1,
                  borderColor: colors.surfaceMuted, marginBottom: 16,
                }}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.inkMuted} />
                  <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, lineHeight: 18 }}>
                    Draft terms pending legal review.
                  </Text>
                </View>
              )}

              <ScrollView
                nestedScrollEnabled
                onScroll={({ nativeEvent: e }) => {
                  // 24px of slack so it can't be impossible to satisfy from
                  // rounding or an over-scroll bounce.
                  const atEnd =
                    e.layoutMeasurement.height + e.contentOffset.y >= e.contentSize.height - 24;
                  if (atEnd) setTermsScrolledToEnd(true);
                }}
                scrollEventThrottle={64}
                style={{
                  maxHeight: 320, borderWidth: 1, borderColor: colors.surfaceMuted,
                  borderRadius: 14, backgroundColor: colors.surface, padding: 16,
                }}
              >
                {VENDOR_TERMS.map(section => (
                  <View key={section.heading} style={{ marginBottom: 18 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 6 }}>
                      {section.heading}
                    </Text>
                    {section.body.map((paragraph, i) => (
                      <Text
                        key={i}
                        style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkSoft, lineHeight: 21, marginBottom: 8 }}
                      >
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                ))}
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost }}>
                  Version {VENDOR_TERMS_VERSION}
                </Text>
              </ScrollView>

              {!termsScrolledToEnd && (
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 10, textAlign: 'center' }}>
                  Scroll to the end to continue
                </Text>
              )}

              <Pressable
                onPress={() => termsScrolledToEnd && setTermsAgreed(a => !a)}
                disabled={!termsScrolledToEnd}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAgreed, disabled: !termsScrolledToEnd }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20,
                  marginBottom: 24, padding: 16, borderRadius: 14,
                  backgroundColor: termsAgreed ? colors.primaryGhost : colors.surface,
                  borderWidth: 1.5,
                  borderColor: termsAgreed ? colors.primary : colors.surfaceMuted,
                  opacity: termsScrolledToEnd ? 1 : 0.5,
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 6, borderWidth: 1.5,
                  borderColor: termsAgreed ? colors.primary : colors.surfaceDeep,
                  backgroundColor: termsAgreed ? colors.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {termsAgreed && <Ionicons name="checkmark" size={16} color={colors.ink} />}
                </View>
                <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.ink, lineHeight: 20 }}>
                  I have read and agree to the vendor terms, and I confirm the details I
                  have provided are accurate.
                </Text>
              </Pressable>
            </View>
          )}

          <Button
            title={step < LAST_STEP ? 'Continue' : 'Submit Application'}
            disabled={isSubmitting || (step === LAST_STEP && !termsAgreed)}
            onPress={async () => {
              if (step === 0) {
                if (!form.storeName || !form.storeSlug || !form.description) {
                  showToast('Please fill out all required fields.', 'warning');
                  return;
                }
                setStep(s => s + 1);
              } else if (step < LAST_STEP) {
                setStep(s => s + 1);
              } else {
                if (!termsAgreed) {
                  showToast('Please accept the vendor terms to continue.', 'warning');
                  return;
                }
                if (!token) {
                  showToast('You must be logged in to register as a vendor.', 'error');
                  return;
                }
                setIsSubmitting(true);
                try {
                  // form.logoUrl / form.bannerUrl hold LOCAL image URIs until
                  // now — upload them to S3 and use the returned public URLs.
                  // Images are optional; a failed upload is surfaced and aborts
                  // so the vendor isn't created with a broken/missing logo.
                  let logo_url: string | undefined;
                  let banner_url: string | undefined;
                  try {
                    if (form.logoUrl) logo_url = await uploadFile(form.logoUrl, token, 'logo');
                    if (form.bannerUrl) banner_url = await uploadFile(form.bannerUrl, token, 'banner');
                  } catch (uploadErr: any) {
                    showToast(uploadErr?.message || 'Image upload failed. Please try again.', 'error');
                    setIsSubmitting(false);
                    return;
                  }

                  await createVendor(token, {
                    store_name: form.storeName,
                    store_slug: form.storeSlug,
                    bio: form.description,
                    // Which version of the terms was accepted, and when. Without
                    // this you can't later show what a vendor actually agreed to.
                    terms_version: VENDOR_TERMS_VERSION,
                    terms_accepted_at: new Date().toISOString(),
                    ...(logo_url && { logo_url }),
                    ...(banner_url && { banner_url }),
                    ...(form.latitude !== null && { latitude: form.latitude }),
                    ...(form.longitude !== null && { longitude: form.longitude }),
                  });

                  showToast('Vendor account created! Pending admin review.', 'success');
                  // Refresh vendor in context THEN navigate — the layout will show the pending screen
                  await refreshVendor();
                  router.replace('/vendor-dashboard' as any);
                } catch (e: any) {
                  // 403 here means an admin closed registration between this
                  // screen loading and the vendor submitting. Switch to the
                  // closed screen rather than showing a bare error toast.
                  if (e?.status === 403) {
                    setRegistrationOpen(false);
                    return;
                  }
                  showToast(e.message || 'Failed to create vendor account', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }
            }}
          />
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
