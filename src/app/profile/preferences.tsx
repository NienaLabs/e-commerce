/**
 * Profile → Preferences
 * ─────────────────────
 * The sidebar's "Preferences" entry used to drop people back into the
 * onboarding wizard — a multi-step flow that re-asked for date of birth and
 * GDPR consent just to change which categories you like. This screen edits the
 * same stored preferences directly, showing what's currently saved.
 *
 * It writes through the existing POST /users/me/onboarding endpoint (the only
 * one that persists these fields), echoing back the values it isn't editing so
 * saving a category change can't wipe a date of birth.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getMe } from '../../api/auth';
import { listCategories } from '../../api/categories';
import { submitOnboarding } from '../../api/onboarding';

const BUDGETS: { value: 'budget' | 'mid' | 'premium'; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'budget', label: 'Budget friendly', hint: 'Show me the best value first', icon: 'pricetag-outline' },
  { value: 'mid', label: 'Mid range', hint: 'A balance of price and quality', icon: 'swap-horizontal-outline' },
  { value: 'premium', label: 'Premium', hint: 'Quality first, price second', icon: 'diamond-outline' },
];

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(token!),
    enabled: !!token,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(0, 50),
    staleTime: 5 * 60_000,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState<'budget' | 'mid' | 'premium' | null>(null);

  // Seed the form once the saved values arrive.
  useEffect(() => {
    if (!me) return;
    setSelectedCategories(me.category_interest_ids ?? []);
    setBudget(me.budget_preference ?? null);
  }, [me]);

  const dirty = useMemo(() => {
    if (!me) return false;
    const saved = [...(me.category_interest_ids ?? [])].sort().join(',');
    const current = [...selectedCategories].sort().join(',');
    return saved !== current || (me.budget_preference ?? null) !== budget;
  }, [me, selectedCategories, budget]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!me?.date_of_birth) {
        // The write endpoint requires a date of birth and we must not invent
        // one. Accounts created before that field existed have to go through
        // onboarding once.
        throw new Error('NEEDS_ONBOARDING');
      }
      return submitOnboarding(token!, {
        gdpr_consent: true,
        date_of_birth: me.date_of_birth,
        gender: me.gender ?? undefined,
        category_ids: selectedCategories,
        budget_preference: budget ?? undefined,
        referral_source: me.referral_source ?? undefined,
      });
    },
    onSuccess: () => {
      showToast('Preferences saved', 'success');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      // Recommendations are seeded from these categories, so they're now stale.
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['groupedProducts'] });
    },
    onError: (err: any) => {
      if (err?.message === 'NEEDS_ONBOARDING') {
        showToast('Finish setting up your profile first', 'error');
        router.push('/(auth)/onboarding' as any);
        return;
      }
      showToast(err?.message ?? 'Could not save preferences', 'error');
    },
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  const loading = meLoading || categoriesLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          style={{ padding: 8, marginRight: 8, marginLeft: -8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Preferences</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !token ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.inkGhost} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.ink, textAlign: 'center' }}>
            Sign in to set your preferences
          </Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', maxWidth: 300 }}>
            Your interests are saved to your account so your feed follows you between devices.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 28, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
            {/* ── Interests ── */}
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink }}>What you&apos;re into</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 4, lineHeight: 19 }}>
                  We use these to pick what shows up on your home screen. Choose at least one.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {categories.map(cat => {
                  const active = selectedCategories.includes(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => toggleCategory(cat.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                        backgroundColor: active ? colors.primaryGhost : colors.surface,
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.surfaceMuted,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      {active && <Ionicons name="checkmark" size={14} color={colors.primaryDim} />}
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: active ? colors.primaryDim : colors.inkSoft }}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedCategories.length === 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.warning} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12.5, color: colors.warning }}>
                    Pick at least one category to save.
                  </Text>
                </View>
              )}
            </View>

            {/* ── Budget ── */}
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink }}>Price range</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 4, lineHeight: 19 }}>
                  Roughly what you tend to shop for.
                </Text>
              </View>

              <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
                {BUDGETS.map((b, i) => {
                  const active = budget === b.value;
                  return (
                    <Pressable
                      key={b.value}
                      // Tapping the active row clears it — there's no other way back to "no preference".
                      onPress={() => setBudget(active ? null : b.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', padding: 18,
                        borderBottomWidth: i === BUDGETS.length - 1 ? 0 : 1,
                        borderBottomColor: colors.surfaceMuted,
                        backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
                      })}
                    >
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: active ? colors.primaryGhost : colors.surfaceSoft,
                        alignItems: 'center', justifyContent: 'center', marginRight: 16,
                      }}>
                        <Ionicons name={b.icon} size={20} color={active ? colors.primaryDim : colors.inkMuted} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15.5, color: colors.ink }}>{b.label}</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }}>{b.hint}</Text>
                      </View>
                      {active && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Related settings, which live on their own screens ── */}
            <View style={{ gap: 12 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink }}>More settings</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
                <LinkRow icon="color-palette-outline" label="Appearance" onPress={() => router.push('/profile/appearance' as any)} colors={colors} />
                <LinkRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/profile/notifications' as any)} colors={colors} last />
              </View>
            </View>
          </ScrollView>

          {/* ── Save bar ── */}
          <View style={{ padding: 20, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted }}>
            <Pressable
              onPress={() => saveMutation.mutate()}
              disabled={!dirty || selectedCategories.length === 0 || saveMutation.isPending}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 16, borderRadius: 16,
                backgroundColor: !dirty || selectedCategories.length === 0 ? colors.surfaceMuted : colors.primary,
                opacity: pressed ? 0.85 : 1,
                maxWidth: 720, alignSelf: 'center', width: '100%',
              })}
            >
              {saveMutation.isPending && <ActivityIndicator size="small" color={colors.onPrimary} />}
              <Text style={{
                fontFamily: 'Inter_700Bold', fontSize: 15,
                color: !dirty || selectedCategories.length === 0 ? colors.inkMuted : colors.onPrimary,
              }}>
                {saveMutation.isPending ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function LinkRow({
  icon, label, onPress, colors, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: any;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', padding: 18,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.surfaceMuted,
        backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
      })}
    >
      <Ionicons name={icon} size={20} color={colors.inkMuted} style={{ marginRight: 14 }} />
      <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15.5, color: colors.ink }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
    </Pressable>
  );
}
