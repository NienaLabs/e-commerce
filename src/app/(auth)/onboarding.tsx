import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Switch,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { submitOnboarding, OnboardingSubmitPayload } from '../../api/onboarding';
import { listCategories, Category } from '../../api/categories';

// — Replace these with real URLs before shipping —
const TERMS_URL = 'https://yourapp.com/terms';
const PRIVACY_URL = 'https://yourapp.com/privacy';

const BUDGET_OPTIONS: { value: NonNullable<OnboardingSubmitPayload['budget_preference']>; label: string; sub: string }[] = [
  { value: 'budget',  label: 'Budget-friendly',   sub: 'Great finds, great prices'    },
  { value: 'mid',     label: 'Mid-range',          sub: 'Quality without the markup'   },
  { value: 'premium', label: 'Premium & Luxury',   sub: 'Only the finest things'       },
];

const SOURCE_OPTIONS: { value: NonNullable<OnboardingSubmitPayload['referral_source']>; label: string }[] = [
  { value: 'social',  label: 'Social Media'    },
  { value: 'friend',  label: 'Friend or Family' },
  { value: 'ad',      label: 'Advertisement'   },
  { value: 'search',  label: 'Search Engine'   },
  { value: 'other',   label: 'Other'           },
];

const GENDER_OPTIONS: { id: NonNullable<OnboardingSubmitPayload['gender']>; label: string }[] = [
  { id: 'male',          label: 'Male'            },
  { id: 'female',        label: 'Female'          },
  { id: 'non_binary',    label: 'Non-binary'      },
  { id: 'prefer_not',    label: 'Prefer not to say' },
];

const TOTAL_STEPS = 4;

// ─── Animated step bar ────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const idx = i + 1;
        const done   = idx < current;
        const active = idx === current;
        return (
          <View
            key={idx}
            style={{
              height: 3,
              flex: active ? 2.5 : 1,
              borderRadius: 2,
              backgroundColor: done || active ? colors.primary : colors.surfaceDeep,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Pill / chip button ────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
  colors,
  cardBg,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  cardBg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.surfaceDeep,
        backgroundColor: selected ? colors.primary : cardBg,
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_500Medium',
          fontSize: 13,
          color: selected ? '#FFFFFF' : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Radio-style row option ────────────────────────────────────────────────────
function RowOption({
  label,
  sub,
  selected,
  onPress,
  colors,
  cardBg,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  cardBg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.surfaceDeep,
        backgroundColor: cardBg,
        marginBottom: 8,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.ink }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { token, markOnboardingComplete } = useAuth();

  const [step, setStep]               = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [gdprConsent, setGdprConsent]         = useState(false);
  const [dob, setDob]                         = useState('');
  const [gender, setGender]                   = useState<OnboardingSubmitPayload['gender']>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [budget, setBudget]                   = useState<OnboardingSubmitPayload['budget_preference']>(undefined);
  const [source, setSource]                   = useState<OnboardingSubmitPayload['referral_source']>(undefined);
  const [categories, setCategories]           = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  useEffect(() => {
    if (step === 3 && categories.length === 0) {
      setLoadingCategories(true);
      listCategories(0, 50)
        .then(data => setCategories(data))
        .catch(e => console.error('Failed to load categories', e))
        .finally(() => setLoadingCategories(false));
    }
  }, [step]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const nextStep = () => {
    if (step === 1 && !gdprConsent) {
      alert('Please accept the data processing terms to continue.');
      return;
    }
    if (step === 2 && dob.length !== 10) {
      alert('Please enter a valid date of birth (YYYY-MM-DD).');
      return;
    }
    if (step === 3 && selectedCategories.size === 0) {
      alert('Please select at least one category.');
      return;
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleFinish = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await submitOnboarding(token, {
        gdpr_consent: gdprConsent,
        date_of_birth: dob,
        gender,
        category_ids: Array.from(selectedCategories),
        budget_preference: budget,
        referral_source: source,
      });
      markOnboardingComplete();
      router.replace('/(tabs)');
    } catch (e: any) {
      alert(e.message || 'Failed to save onboarding data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => router.replace('/(tabs)');




  // Theme shorthands
  const bg       = isDark ? colors.surface   : '#F8F7FC';
  const cardBg   = isDark ? colors.surfaceSoft : '#FFFFFF';
  const ink      = colors.ink;
  const inkSoft  = colors.inkSoft;
  const inkGhost = colors.inkGhost;

  const eyebrowStyle = {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: colors.primary,
    marginBottom: 10,
  };

  const titleStyle = {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: ink,
    lineHeight: 38,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: inkSoft,
    lineHeight: 22,
    marginBottom: 28,
  };

  const fieldLabelStyle = {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: inkGhost,
    marginBottom: 8,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 480,
            paddingHorizontal: 24,
            flex: 1,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Top bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            {step > 1 ? (
              <Pressable
                onPress={prevStep}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="arrow-back" size={18} color={ink} />
              </Pressable>
            ) : (
              <View style={{ width: 36 }} />
            )}
            <Pressable onPress={handleSkip}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: inkSoft }}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Step bar */}
          <StepBar current={step} />

          {/* ── Step 1: Data consent ─────────────────────────────────────────── */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>Getting started</Text>
              <Text style={titleStyle}>A space built{'\n'}for you.</Text>
              <Text style={subtitleStyle}>
                Before we begin, we need your permission to personalise your experience.
              </Text>

              {/* Consent toggle card */}
              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: gdprConsent ? colors.primary : colors.surfaceDeep,
                  padding: 18,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  {/* Icon */}
                  <View
                    style={{
                      width: 40, height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceSoft,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: ink, marginBottom: 4 }}>
                      Data Processing Consent
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: inkSoft, lineHeight: 19 }}>
                      I agree to the collection and processing of my personal data in accordance with GDPR.
                    </Text>
                  </View>

                  {/* Toggle */}
                  <Switch
                    value={gdprConsent}
                    onValueChange={setGdprConsent}
                    trackColor={{ false: colors.surfaceDeep, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.surfaceDeep}
                  />
                </View>
              </View>

              {/* Links row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSoft,
                  borderRadius: 12,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Ionicons name="information-circle-outline" size={16} color={inkGhost} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: inkSoft, flex: 1, lineHeight: 18 }}>
                  Read our{' '}
                  <Text
                    onPress={() => Linking.openURL(TERMS_URL)}
                    style={{ fontFamily: 'Inter_600SemiBold', color: colors.primary, textDecorationLine: 'underline' }}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    onPress={() => Linking.openURL(PRIVACY_URL)}
                    style={{ fontFamily: 'Inter_600SemiBold', color: colors.primary, textDecorationLine: 'underline' }}
                  >
                    Privacy Policy
                  </Text>
                  {' '}to learn exactly how your data is used.
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  padding: 12,
                  backgroundColor: `${colors.primary}0A`,
                  borderRadius: 10,
                }}
              >
                <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: inkSoft }}>
                  Your data is never sold. It's used only to personalise your feed.
                </Text>
              </View>
            </View>
          )}

          {/* ── Step 2: DOB + gender ──────────────────────────────────────────── */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>About you</Text>
              <Text style={titleStyle}>Tell us a little{'\n'}about yourself.</Text>
              <Text style={subtitleStyle}>Helps us verify your age and tailor content for you.</Text>

              <Text style={fieldLabelStyle}>Date of Birth</Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inkGhost}
                keyboardType="default"
                maxLength={10}
                style={{
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: colors.surfaceDeep,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.ink,
                  fontFamily: 'Inter_400Regular',
                  marginBottom: 24,
                }}
              />

              <Text style={fieldLabelStyle}>
                Gender{' '}
                <Text style={{ fontFamily: 'Inter_400Regular', textTransform: 'none', letterSpacing: 0, fontSize: 11, color: inkGhost }}>
                  · optional
                </Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {GENDER_OPTIONS.map(g => (
                  <Chip
                    key={g.id}
                    label={g.label}
                    selected={gender === g.id}
                    onPress={() => setGender(gender === g.id ? undefined : g.id)}
                    colors={colors}
                    cardBg={cardBg}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Step 3: Categories + budget ──────────────────────────────────── */}
          {step === 3 && (
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>Your taste</Text>
              <Text style={titleStyle}>What catches{'\n'}your eye?</Text>
              <Text style={subtitleStyle}>Pick your favourite categories.</Text>

              {loadingCategories ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
                  {categories.map(cat => (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      selected={selectedCategories.has(cat.id)}
                      onPress={() => toggleCategory(cat.id)}
                      colors={colors}
                      cardBg={cardBg}
                    />
                  ))}
                </View>
              )}

              <Text style={[fieldLabelStyle, { marginBottom: 12 }]}>
                Budget preference{' '}
                <Text style={{ fontFamily: 'Inter_400Regular', textTransform: 'none', letterSpacing: 0, fontSize: 11, color: inkGhost }}>
                  · optional
                </Text>
              </Text>
              {BUDGET_OPTIONS.map(opt => (
                <RowOption
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={budget === opt.value}
                  onPress={() => setBudget(budget === opt.value ? undefined : opt.value)}
                  colors={colors}
                  cardBg={cardBg}
                />
              ))}
            </View>
          )}

          {/* ── Step 4: Referral source + finish card ────────────────────────── */}
          {step === 4 && (
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>One last thing</Text>
              <Text style={titleStyle}>Almost{'\n'}there.</Text>
              <Text style={subtitleStyle}>How did you discover us?</Text>

              {SOURCE_OPTIONS.map(opt => (
                <RowOption
                  key={opt.value}
                  label={opt.label}
                  selected={source === opt.value}
                  onPress={() => setSource(source === opt.value ? undefined : opt.value)}
                  colors={colors}
                  cardBg={cardBg}
                />
              ))}

              {/* Finish card */}
              <View
                style={{
                  marginTop: 20,
                  alignItems: 'center',
                  padding: 24,
                  backgroundColor: `${colors.primary}0D`,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: `${colors.primary}20`,
                }}
              >
                <View
                  style={{
                    width: 52, height: 52,
                    borderRadius: 16,
                    backgroundColor: `${colors.primary}18`,
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Ionicons name="sparkles" size={26} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: ink, marginBottom: 6 }}>
                  Your feed is ready.
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: inkSoft, textAlign: 'center', lineHeight: 20 }}>
                  We've curated products around your preferences. The best is waiting.
                </Text>
              </View>
            </View>
          )}

          {/* ── CTA button ───────────────────────────────────────────────────── */}
          <View style={{ marginTop: 32 }}>
            {step < TOTAL_STEPS ? (
              <Pressable
                onPress={nextStep}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16, letterSpacing: 0.2 }}>
                  Continue
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleFinish}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: pressed || isSubmitting ? 0.8 : 1,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16, letterSpacing: 0.2 }}>
                    Let's Shop ✦
                  </Text>
                )}
              </Pressable>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}