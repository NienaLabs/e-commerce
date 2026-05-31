import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';

const STEPS = [
  { key: 'info', label: 'Business Info', icon: 'business' },
  { key: 'docs', label: 'Documents', icon: 'document-text' },
  { key: 'store', label: 'Store Setup', icon: 'storefront' },
];

const CATEGORY_OPTIONS = ['Electronics', 'Fashion', 'Home & Living', 'Food & Groceries', 'Beauty', 'Sports', 'Gaming', 'Health', 'Books', 'Automotive', 'Art', 'Toys'];

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
            <Text style={{ fontFamily: idx === current ? 'Inter_700Bold' : 'OpenSans_400Regular', fontSize: 11, color: idx <= current ? colors.ink : colors.inkGhost, marginTop: 6, textAlign: 'center', width: 64 }}>{step.label}</Text>
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
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: '', ownerName: '', phone: '', email: '', category: '', description: '',
    regNumber: '', taxId: '', storeName: '', storeSlug: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
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

          {/* Step 1 — Business Info */}
          {step === 0 && (
            <View>
              <Field label="Business Name *" placeholder="e.g. SoundWave Audio" value={form.businessName} onChangeText={(v: string) => setForm(f => ({ ...f, businessName: v }))} colors={colors} />
              <Field label="Owner / Contact Name *" placeholder="e.g. Kofi Mensah" value={form.ownerName} onChangeText={(v: string) => setForm(f => ({ ...f, ownerName: v }))} colors={colors} />
              <Field label="Phone Number *" placeholder="+233 55 000 1234" value={form.phone} onChangeText={(v: string) => setForm(f => ({ ...f, phone: v }))} colors={colors} />
              <Field label="Business Email *" placeholder="hello@yourbusiness.com" value={form.email} onChangeText={(v: string) => setForm(f => ({ ...f, email: v }))} colors={colors} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 4 }}>Categories You Sell *</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 12 }}>Select all that apply</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {CATEGORY_OPTIONS.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: active ? colors.ink : colors.surfaceSoft,
                        borderWidth: 1.5,
                        borderColor: active ? colors.ink : colors.surfaceMuted,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      {active && <Ionicons name="checkmark" size={13} color={colors.primary} />}
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: active ? colors.surface : colors.inkSoft }}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 2 — Documents */}
          {step === 1 && (
            <View>
              <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="information-circle" size={20} color={colors.info} style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Why do we need this?</Text>
                </View>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>
                  Providing your business registration and tax details helps us keep the platform safe and ensures proper payouts.
                </Text>
              </View>
              <Field label="Business Registration Number" placeholder="e.g. BN-2024-12345" value={form.regNumber} onChangeText={(v: string) => setForm(f => ({ ...f, regNumber: v }))} colors={colors} />
              <Field label="Tax Identification Number (TIN)" placeholder="e.g. TIN-987654" value={form.taxId} onChangeText={(v: string) => setForm(f => ({ ...f, taxId: v }))} colors={colors} />
              {/* Upload placeholders */}
              {['Business Certificate', 'Valid ID / Passport', 'Proof of Bank Account'].map(doc => (
                <Pressable key={doc} style={{ borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, padding: 20, alignItems: 'center', marginBottom: 12, backgroundColor: colors.surfaceSoft }}>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.inkGhost} style={{ marginBottom: 8 }} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>{doc}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 4 }}>Tap to upload PDF or image</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 3 — Store Setup */}
          {step === 2 && (
            <View>
              <Field label="Store Name *" placeholder="e.g. SoundWave Audio" value={form.storeName} onChangeText={(v: string) => setForm(f => ({ ...f, storeName: v }))} colors={colors} />
              <Field label="Store URL Slug *" placeholder="e.g. soundwave-audio" value={form.storeSlug} onChangeText={(v: string) => setForm(f => ({ ...f, storeSlug: v }))} colors={colors} />
              <Field label="Store Bio / Description *" placeholder="Tell customers what makes your store special..." value={form.description} onChangeText={(v: string) => setForm(f => ({ ...f, description: v }))} colors={colors} multiline />
              {/* Logo / Banner upload */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Store Logo</Text>
              <Pressable style={{ borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: colors.surfaceSoft }}>
                <Ionicons name="image-outline" size={32} color={colors.inkGhost} style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Upload Logo</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 4 }}>PNG or JPG, at least 400×400px</Text>
              </Pressable>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Store Banner</Text>
              <Pressable style={{ borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, padding: 24, alignItems: 'center', marginBottom: 24, backgroundColor: colors.surfaceSoft }}>
                <Ionicons name="image-outline" size={32} color={colors.inkGhost} style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>Upload Banner</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, marginTop: 4 }}>PNG or JPG, 1200×400px recommended</Text>
              </Pressable>
            </View>
          )}

          <Button
            title={step < 2 ? 'Continue' : 'Submit Application'}
            onPress={() => step < 2 ? setStep(s => s + 1) : setSubmitted(true)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
