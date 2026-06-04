import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebHeader } from '../../components/WebHeader';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function SupportScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Help & Support</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.surface, marginBottom: 8 }}>Need Help?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.surfaceMuted, marginBottom: 20 }}>Our support team is available 24/7 to assist you.</Text>
          <Pressable 
            onPress={() => showToast('Opening support chat...', 'success')}
            style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.isDark ? colors.ink : '#222022' }}>Contact Support</Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>FAQ</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, padding: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 8 }}>How do I track my order?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, marginBottom: 20, lineHeight: 22 }}>You can track your order by going to the 'My Orders' section and tapping on your current order to see real-time updates.</Text>
          
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 8 }}>What is your return policy?</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 22 }}>We offer a 30-day money-back guarantee on all our products. Please ensure items are in their original condition.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
