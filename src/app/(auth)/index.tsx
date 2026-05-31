import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, Dimensions, Platform,
  useWindowDimensions, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

const SLIDES = [
  {
    icon: 'flash' as const,
    title: 'Shop with Speed',
    subtitle: 'Discover vendors around you and get what you need delivered fast. Real-time tracking, every step of the way.',
    accent: '#c3d809',
  },
  {
    icon: 'storefront' as const,
    title: 'Sell to Thousands',
    subtitle: 'Open your digital storefront in minutes. List products, manage orders, and grow your business — all from your phone.',
    accent: '#c3d809',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Delivered Securely',
    subtitle: 'Every delivery is verified with a unique PIN code. No disputes, no guesswork. Your satisfaction is guaranteed.',
    accent: '#c3d809',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slideWidth = isDesktop ? 400 : width;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
      setActiveIndex(next);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(idx);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>

      {/* Electric glow blobs — decorative */}
      <View style={{
        position: 'absolute', top: -80, right: -80,
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: '#c3d80918',
      }} />
      <View style={{
        position: 'absolute', bottom: height * 0.3, left: -60,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: '#c3d80912',
      }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Skip */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 28, paddingTop: 12 }}>
          <Pressable onPress={() => router.push('/(auth)/login')} style={{ padding: 8 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: `${colors.primary}cc` }}>
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Slides */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={!isDesktop}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEnabled={!isDesktop}
            style={{ width: isDesktop ? slideWidth : width }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {(isDesktop ? [SLIDES[activeIndex]] : SLIDES).map((slide, i) => (
              <View
                key={i}
                style={{
                  width: slideWidth,
                  paddingHorizontal: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: isDesktop ? 0 : 20,
                }}
              >
                {/* Icon blob */}
                <View style={{
                  width: 120, height: 120, borderRadius: 36,
                  backgroundColor: '#c3d80920',
                  borderWidth: 1.5,
                  borderColor: '#c3d80940',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 44,
                  shadowColor: '#c3d809',
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.2,
                  shadowRadius: 32,
                  elevation: 8,
                }}>
                  <Ionicons name={slide.icon} size={52} color={colors.primary} />
                </View>

                <Text style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: isDesktop ? 36 : 30,
                  color: colors.surface,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: isDesktop ? 44 : 36,
                }}>
                  {slide.title}
                </Text>

                <Text style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 16,
                  color: `${colors.surface}99`,
                  textAlign: 'center',
                  lineHeight: 26,
                  maxWidth: 320,
                }}>
                  {slide.subtitle}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Controls */}
        <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 28, paddingBottom: 12 }}>

          {/* Dot indicators */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => {
                  scrollRef.current?.scrollTo({ x: i * slideWidth, animated: true });
                  setActiveIndex(i);
                }}>
                  <View style={{
                    width: i === activeIndex ? 24 : 8,
                    height: 8, borderRadius: 4,
                    backgroundColor: i === activeIndex ? colors.primary : `${colors.surface}40`,
                  }} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Desktop slide arrows */}
          {isDesktop && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveIndex(i)}>
                  <View style={{
                    width: i === activeIndex ? 28 : 8,
                    height: 8, borderRadius: 4,
                    backgroundColor: i === activeIndex ? colors.primary : `${colors.surface}40`,
                  }} />
                </Pressable>
              ))}
            </View>
          )}

          {/* CTA Button */}
          <Pressable
            onPress={goNext}
            style={({ pressed }) => ({
              height: 58,
              backgroundColor: pressed ? '#afc007' : colors.primary,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 6,
              maxWidth: isDesktop ? 400 : undefined,
              alignSelf: isDesktop ? 'center' : 'stretch',
              width: isDesktop ? 400 : undefined,
            })}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.ink }}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.ink} />
          </Pressable>

          {/* Login shortcut */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 4 }}>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: `${colors.surface}70` }}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}
