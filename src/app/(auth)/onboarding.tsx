import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Switch,
  Linking,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { submitOnboarding, OnboardingSubmitPayload } from '../../api/onboarding';
import { listCategories, Category } from '../../api/categories';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  LinearTransition,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { OptimizedImage } from '../../components/ui/OptimizedImage';

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

// ─── Date of birth ────────────────────────────────────────────────────────────

const MIN_AGE_YEARS = 13;
const MAX_AGE_YEARS = 120;

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const shiftYears = (years: number) => {
  const d = startOfToday();
  d.setFullYear(d.getFullYear() - years);
  return d;
};

const MAX_DOB = shiftYears(MIN_AGE_YEARS);
const MIN_DOB = shiftYears(MAX_AGE_YEARS);
const DEFAULT_DOB = shiftYears(25);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDobToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

function formatDobForDisplay(value: string): string {
  const date = parseDobToDate(value);
  if (!date) return value;
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function validateDob(value: string): string | null {
  const date = parseDobToDate(value);
  if (!date) return 'Please choose your date of birth.';
  if (date > MAX_DOB) return `You need to be at least ${MIN_AGE_YEARS} to use the app.`;
  if (date < MIN_DOB) return 'That date doesn’t look right.';
  return null;
}

// ─── Animations & Assets ────────────────────────────────────────────────────────

const ILLUSTRATIONS = {
  welcome: require('../../../../assets/onboarding/bird-welcome.png'),
  consent: require('../../../../assets/onboarding/bird-about.png'),
  about: require('../../../../assets/onboarding/bird-about.png'),
  interests: require('../../../../assets/onboarding/bird-preferences.png'),
  finish: require('../../../../assets/onboarding/bird-social.png'),
};

function WavyBackground({ isDark }: { isDark: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={isDark ? '#1C1525' : '#FAF9FD'} stopOpacity="1" />
            <Stop offset="100%" stopColor={isDark ? '#0A0510' : '#F0EAF8'} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M0,0 L400,0 L400,800 L0,800 Z" fill="url(#bgGrad)" />
        
        {/* Top Wave */}
        <Path
          d="M0,150 C100,50 250,200 400,100 L400,0 L0,0 Z"
          fill={isDark ? 'rgba(150, 100, 255, 0.05)' : 'rgba(120, 80, 255, 0.05)'}
        />
        
        {/* Bottom Blob Wave */}
        <Path
          d="M0,650 C150,800 280,550 400,700 L400,800 L0,800 Z"
          fill={isDark ? 'rgba(255, 80, 150, 0.05)' : 'rgba(255, 120, 180, 0.06)'}
        />
      </Svg>
    </View>
  );
}

function FloatingImage({ source }: { source: any }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 32, height: 260 }}>
      <OptimizedImage
        source={source}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        transition={500}
      />
    </View>
  );
}

// ─── UI Components ────────────────────────────────────────────────────────

function ModernStepBar({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <Animated.View
            key={idx}
            layout={LinearTransition.springify().damping(18).stiffness(150)}
            style={{
              height: 4,
              width: active ? 32 : 12,
              borderRadius: 2,
              backgroundColor: done || active ? colors.primary : colors.surfaceDeep,
              opacity: active ? 1 : 0.4,
            }}
          />
        );
      })}
    </View>
  );
}

function ModernChip({
  label, selected, onPress, colors, isDark
}: {
  label: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Animated.View
          layout={LinearTransition.springify()}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: selected ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backgroundColor: selected ? colors.primary : isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
            marginBottom: 10,
            marginRight: 10,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selected ? 0.2 : 0,
            shadowRadius: 8,
            elevation: selected ? 4 : 0,
          }}
        >
          <Text
            style={{
              fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_500Medium',
              fontSize: 14,
              color: selected ? '#FFFFFF' : colors.ink,
            }}
          >
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function ModernRowOption({
  label, sub, selected, onPress, colors, isDark
}: {
  label: string; sub?: string; selected: boolean; onPress: () => void; colors: any; isDark: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: selected ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backgroundColor: isDark ? (selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)') : (selected ? '#FAFAFF' : '#FFFFFF'),
            marginBottom: 12,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: selected ? colors.primary : colors.ink }}>
              {label}
            </Text>
            {sub ? (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
                {sub}
              </Text>
            ) : null}
          </View>
          <View style={{
            width: 24, height: 24, borderRadius: 12, borderWidth: 2,
            borderColor: selected ? colors.primary : colors.surfaceDeep,
            alignItems: 'center', justifyContent: 'center'
          }}>
            {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, markOnboardingComplete } = useAuth();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [gdprConsent, setGdprConsent] = useState(false);
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [gender, setGender] = useState<OnboardingSubmitPayload['gender']>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState<OnboardingSubmitPayload['budget_preference']>(undefined);
  const [source, setSource] = useState<OnboardingSubmitPayload['referral_source']>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchCats = async () => {
      if (step === 3 && categories.length === 0) {
        setLoadingCategories(true);
        try {
          const data = await listCategories(0, 50);
          if (active) setCategories(data);
        } catch (e) {
          console.error('Failed to load categories', e);
        } finally {
          if (active) setLoadingCategories(false);
        }
      }
    };
    fetchCats();
    return () => { active = false; };
  }, [step, categories.length]);

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
    if (step === 2) {
      const error = validateDob(dob);
      if (error) {
        setDobError(error);
        return;
      }
      setDobError(null);
    }
    if (step === 3 && selectedCategories.size === 0) {
      alert('Please select at least one category.');
      return;
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
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

  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 1)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
    marginBottom: 24,
  };

  const eyebrowStyle = {
    fontFamily: 'OpenSans_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center' as const,
  };

  const titleStyle = {
    fontFamily: 'OpenSans_700Bold',
    fontSize: 34,
    color: colors.ink,
    lineHeight: 42,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  };

  const subtitleStyle = {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.inkSoft,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center' as const,
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View key="step0" entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <FloatingImage source={ILLUSTRATIONS.welcome} />
            <Text style={eyebrowStyle}>Welcome to the Future</Text>
            <Text style={titleStyle}>Experience{'\n'}Shopping, Redefined.</Text>
            <Text style={subtitleStyle}>
              Tired of endless scrolling on ordinary platforms? Welcome to the ultimate curated marketplace. We eliminate the noise and deliver exactly what you desire.
            </Text>

            <View style={glassCardStyle}>
              {[
                { icon: 'pricetags-outline' as const, text: 'Bespoke curation matched to your lifestyle.' },
                { icon: 'storefront-outline' as const, text: 'Access local gems & global premium brands.' },
                { icon: 'lock-closed-outline' as const, text: 'Uncompromised privacy. Your data is yours.' },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: idx < 2 ? 16 : 0 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceSoft,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.inkSoft, lineHeight: 20 }}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        );
      case 1:
        return (
          <Animated.View key="step1" entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <FloatingImage source={ILLUSTRATIONS.consent} />
            <Text style={eyebrowStyle}>Getting started</Text>
            <Text style={titleStyle}>A space built{'\n'}just for you.</Text>
            <Text style={subtitleStyle}>Before we begin, we need your permission to personalise your experience.</Text>

            <View style={[glassCardStyle, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceSoft,
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 4 }}>
                    Data Processing
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.inkSoft, lineHeight: 18 }}>
                    I agree to the collection and processing of my personal data in accordance with GDPR.
                  </Text>
                </View>
                <Switch
                  value={gdprConsent}
                  onValueChange={setGdprConsent}
                  trackColor={{ false: colors.surfaceDeep, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
              <Ionicons name="information-circle" size={16} color={colors.inkGhost} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.inkSoft, flex: 1 }}>
                Read our{' '}
                <Text onPress={() => Linking.openURL(TERMS_URL)} style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Terms</Text>
                {' '}and{' '}
                <Text onPress={() => Linking.openURL(PRIVACY_URL)} style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Privacy Policy</Text>.
              </Text>
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View key="step2" entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <FloatingImage source={ILLUSTRATIONS.about} />
            <Text style={eyebrowStyle}>About You</Text>
            <Text style={titleStyle}>Tell us a little{'\n'}about yourself.</Text>
            <Text style={subtitleStyle}>This helps us verify your age and tailor content for you.</Text>

            <View style={glassCardStyle}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, textTransform: 'uppercase', color: colors.inkGhost, marginBottom: 12 }}>
                Date of Birth
              </Text>
              
              {Platform.OS === 'web' ? (
                /* @ts-ignore */
                <input
                  type="date"
                  value={dob || ''}
                  max={toIsoDate(MAX_DOB)}
                  min={toIsoDate(MIN_DOB)}
                  onChange={(e: any) => { setDob(e.target.value); setDobError(null); }}
                  style={{
                    width: '100%', padding: 16, borderRadius: 16, borderWidth: 1,
                    borderColor: dob ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9F9FB',
                    color: dob ? colors.ink : colors.inkGhost,
                    fontSize: 16, fontFamily: 'Inter_500Medium', outlineStyle: 'none',
                    marginBottom: dobError ? 8 : 24,
                  }}
                />
              ) : (
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 18, borderRadius: 16, borderWidth: 1,
                    borderColor: dob ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9F9FB',
                    marginBottom: dobError ? 8 : 24,
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'Inter_500Medium', color: dob ? colors.ink : colors.inkGhost }}>
                    {dob ? formatDobForDisplay(dob) : 'Select your date of birth'}
                  </Text>
                  <Ionicons name="calendar" size={20} color={dob ? colors.primary : colors.inkMuted} />
                </Pressable>
              )}

              {dobError && (
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.error, marginBottom: 20 }}>
                  {dobError}
                </Text>
              )}

              {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={parseDobToDate(dob) ?? DEFAULT_DOB}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={MAX_DOB}
                  minimumDate={MIN_DOB}
                  onChange={(event: any, selected?: Date) => {
                    if (Platform.OS !== 'ios') setShowDatePicker(false);
                    if (event.type === 'dismissed' || !selected) return;
                    setDob(toIsoDate(selected));
                    setDobError(null);
                  }}
                />
              )}
              {showDatePicker && Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={{ alignSelf: 'flex-end', padding: 8, marginBottom: 16 }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primary }}>Done</Text>
                </Pressable>
              )}

              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, textTransform: 'uppercase', color: colors.inkGhost, marginBottom: 12 }}>
                Gender <Text style={{ textTransform: 'none', color: colors.inkGhost }}>(Optional)</Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {GENDER_OPTIONS.map(g => (
                  <ModernChip
                    key={g.id} label={g.label} selected={gender === g.id}
                    onPress={() => setGender(gender === g.id ? undefined : g.id)}
                    colors={colors} isDark={isDark}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View key="step3" entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <FloatingImage source={ILLUSTRATIONS.interests} />
            <Text style={eyebrowStyle}>Your Taste</Text>
            <Text style={titleStyle}>What catches{'\n'}your eye?</Text>
            <Text style={subtitleStyle}>Pick your favourite categories.</Text>

            <View style={glassCardStyle}>
              {loadingCategories ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
                  {categories.map(cat => (
                    <ModernChip
                      key={cat.id} label={cat.name} selected={selectedCategories.has(cat.id)}
                      onPress={() => toggleCategory(cat.id)} colors={colors} isDark={isDark}
                    />
                  ))}
                </View>
              )}

              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, textTransform: 'uppercase', color: colors.inkGhost, marginBottom: 16 }}>
                Budget Preference <Text style={{ textTransform: 'none', color: colors.inkGhost }}>(Optional)</Text>
              </Text>
              {BUDGET_OPTIONS.map(opt => (
                <ModernRowOption
                  key={opt.value} label={opt.label} sub={opt.sub}
                  selected={budget === opt.value} onPress={() => setBudget(budget === opt.value ? undefined : opt.value)}
                  colors={colors} isDark={isDark}
                />
              ))}
            </View>
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View key="step4" entering={FadeInRight.duration(400)} exiting={FadeOutLeft.duration(300)}>
            <FloatingImage source={ILLUSTRATIONS.finish} />
            <Text style={eyebrowStyle}>One Last Thing</Text>
            <Text style={titleStyle}>Almost{'\n'}there.</Text>
            <Text style={subtitleStyle}>How did you discover us?</Text>

            <View style={glassCardStyle}>
              {SOURCE_OPTIONS.map(opt => (
                <ModernRowOption
                  key={opt.value} label={opt.label} selected={source === opt.value}
                  onPress={() => setSource(source === opt.value ? undefined : opt.value)}
                  colors={colors} isDark={isDark}
                />
              ))}
            </View>

            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{
              marginTop: 10, padding: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceSoft,
              borderRadius: 24, alignItems: 'center'
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8
              }}>
                <Ionicons name="sparkles" size={28} color="#FFF" />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginBottom: 8 }}>
                Your feed is ready.
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 22 }}>
                We've curated an exclusive selection of products around your preferences. The best is waiting.
              </Text>
            </Animated.View>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDark ? '#1C1525' : '#FAF9FD' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WavyBackground isDark={isDark} />
      
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 500, paddingHorizontal: 24, flex: 1 }}>
          
          {/* Top Nav Bar */}
          {step > 0 && (
            <Animated.View entering={FadeInDown} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              {step > 1 ? (
                <Pressable
                  onPress={prevStep}
                  style={({ pressed }) => ({
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFF',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
                  })}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.ink} />
                </Pressable>
              ) : (
                <View style={{ width: 44 }} />
              )}
              
              <ModernStepBar current={step} total={TOTAL_STEPS} />

              <Pressable onPress={handleSkip} style={{ padding: 10 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkSoft }}>
                  Skip
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {renderStepContent()}

          {/* ── CTA button ───────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: 'auto', paddingTop: 32 }}>
            {step < TOTAL_STEPS ? (
              <Pressable
                onPress={nextStep}
                style={({ pressed }) => ({
                  backgroundColor: colors.ink,
                  paddingVertical: 18,
                  borderRadius: 20,
                  alignItems: 'center',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: colors.ink,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 5,
                })}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: isDark ? '#000' : '#FFF', fontSize: 17, letterSpacing: 0.3 }}>
                  {step === 0 ? 'Get Started' : 'Continue'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleFinish}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 18,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 12,
                  opacity: isSubmitting ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 6,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 17, letterSpacing: 0.5 }}>
                      Let's Shop
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </Pressable>
            )}
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}