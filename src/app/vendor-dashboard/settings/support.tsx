import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

export default function SupportSettingsScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Help & Support</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: 640, alignSelf: 'center', width: '100%', gap: 24, paddingBottom: 60 }}>
        
        {/* Support Options */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable style={({ pressed }) => ({
            flex: 1, backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            borderRadius: 20, padding: 20, alignItems: 'center',
            borderWidth: 1, borderColor: colors.surfaceMuted,
          })}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.infoGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="chatbubbles" size={24} color={colors.info} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Live Chat</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textAlign: 'center' }}>Available 24/7</Text>
          </Pressable>

          <Pressable 
            onPress={() => Linking.openURL('mailto:vendorsupport@electric.app')}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderRadius: 20, padding: 20, alignItems: 'center',
              borderWidth: 1, borderColor: colors.surfaceMuted,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="mail" size={24} color={colors.primaryDim} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Email Us</Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textAlign: 'center' }}>Usually replies in 2h</Text>
          </Pressable>
        </View>

        {/* Resources */}
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 12 }}>Resources</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingLeft: 8, borderWidth: 1, borderColor: colors.surfaceMuted, overflow: 'hidden' }}>
            <Pressable style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: 16, paddingLeft: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, backgroundColor: pressed ? colors.surfaceSoft : 'transparent' })}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="book" size={18} color={colors.ink} />
              </View>
              <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Vendor Guide</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
            </Pressable>
            <Pressable style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: 16, paddingLeft: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, backgroundColor: pressed ? colors.surfaceSoft : 'transparent' })}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.ink} />
              </View>
              <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Platform Policies</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
            </Pressable>
            <Pressable style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: 16, paddingLeft: 8, backgroundColor: pressed ? colors.surfaceSoft : 'transparent' })}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="bulb" size={18} color={colors.ink} />
              </View>
              <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Tips for Selling</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} />
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
