import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ONBOARDING_STEPS = [
  {
    id: '1',
    title: 'Discover Premium Products',
    description: 'Explore a curated collection of high-quality electronics tailored just for you.',
    icon: 'cube' as const,
  },
  {
    id: '2',
    title: 'Fast & Secure Checkout',
    description: 'Experience seamless payments with top-tier security for your peace of mind.',
    icon: 'lock-closed' as const,
  },
  {
    id: '3',
    title: 'Seamless Tracking',
    description: 'Track your orders in real-time from our warehouse straight to your doorstep.',
    icon: 'location' as const,
  },
];

import * as Location from 'expo-location';

export default function EntryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleGetStarted = async () => {
    try {
      // Request Location Permission
      await Location.requestForegroundPermissionsAsync();
      
      // Mock Notification Permission request for demo
      if (Platform.OS !== 'web') {
        // Normally we'd use expo-notifications here
      }
    } catch (error) {
      console.log('Permission error', error);
    }
    
    // @ts-ignore
    router.replace('/(tabs)/');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const goToNextSlide = () => {
    if (activeIndex < ONBOARDING_STEPS.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleGetStarted();
    }
  };

  // ─── DESKTOP LANDING PAGE ───
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0' }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceae6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash" size={28} color="#c3d809" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#222022', marginLeft: 8 }}>Electric</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <Pressable onPress={handleGetStarted}><Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#3a383a' }}>Shop Now</Text></Pressable>
              <Pressable onPress={handleGetStarted} style={{ backgroundColor: '#222022', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#ffffff' }}>Log In</Text>
              </Pressable>
            </View>
          </View>

          {/* Hero Section */}
          <View style={{ paddingHorizontal: 40, paddingVertical: 80, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', maxWidth: 800 }}>
              <View style={{ backgroundColor: '#c3d80920', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#7a8a05', textTransform: 'uppercase', letterSpacing: 1 }}>Welcome to the future of e-commerce</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 56, color: '#222022', textAlign: 'center', lineHeight: 64, marginBottom: 24, letterSpacing: -1 }}>
                Premium electronics, curated for your refined taste.
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 20, color: '#6b696b', textAlign: 'center', marginBottom: 40, maxWidth: 600 }}>
                Experience clean, airy, and confident shopping. Discover products that elevate your everyday life.
              </Text>
              <View style={{ width: 200 }}>
                <Button title="Start Shopping" onPress={handleGetStarted} />
              </View>
            </View>
          </View>

          {/* Features Grid */}
          <View style={{ paddingHorizontal: 40, paddingVertical: 60, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eceae6' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: '#222022', textAlign: 'center', marginBottom: 48 }}>Why Choose Electric</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
              {ONBOARDING_STEPS.map(step => (
                <View key={step.id} style={{ width: 300, alignItems: 'center', padding: 24, backgroundColor: '#f5f5f0', borderRadius: 24, borderWidth: 1, borderColor: '#eceae6' }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#222022', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                    <Ionicons name={step.icon} size={40} color="#222022" />
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022', textAlign: 'center', marginBottom: 12 }}>{step.title}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 16, color: '#6b696b', textAlign: 'center', lineHeight: 24 }}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Footer */}
          <View style={{ padding: 40, backgroundColor: '#222022', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, color: '#ffffff', marginBottom: 16 }}>Electric</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#9e9c9e' }}>© 2026 Electric Inc. All rights reserved.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── MOBILE ONBOARDING CAROUSEL ───
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 16 }}>
        <Pressable onPress={handleGetStarted}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#9e9c9e' }}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {ONBOARDING_STEPS.map((step, index) => (
          <View key={step.id} style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View style={{ 
              width: 160, height: 160, borderRadius: 80, backgroundColor: '#f5f5f0', 
              alignItems: 'center', justifyContent: 'center', marginBottom: 48,
              borderWidth: 1, borderColor: '#eceae6',
            }}>
              <Ionicons name={step.icon} size={80} color="#c3d809" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: '#222022', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 }}>
              {step.title}
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 16, color: '#6b696b', textAlign: 'center', lineHeight: 24 }}>
              {step.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View 
              key={index} 
              style={{ 
                width: index === activeIndex ? 24 : 8, 
                height: 8, 
                borderRadius: 4, 
                backgroundColor: index === activeIndex ? '#c3d809' : '#eceae6',
              }} 
            />
          ))}
        </View>

        <Button 
          title={activeIndex === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Next"} 
          onPress={goToNextSlide} 
        />
      </View>
    </SafeAreaView>
  );
}