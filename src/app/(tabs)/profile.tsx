import React from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
}

const SettingsRow = ({ icon, title, onPress, color = "#3a383a" }: SettingsRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [{
      flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: '#eceae6',
      backgroundColor: pressed ? '#f5f5f0' : 'transparent',
    }]}
  >
    <View style={{ width: 40, alignItems: 'center' }}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, flex: 1, color }}>
      {title}
    </Text>
    <Ionicons name="chevron-forward" size={18} color="#9e9c9e" style={{ marginRight: 8 }} />
  </Pressable>
);

export default function Profile() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>


      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>

          {/* Profile Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#ffffff', padding: 20, borderRadius: 20,
            borderWidth: 1, borderColor: '#eceae6',
            shadowColor: '#222022', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
            marginBottom: 32,
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#c3d80920',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#c3d80960',
              marginRight: 20,
            }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#222022' }}>JD</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#222022', marginBottom: 4 }}>John Doe</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b' }}>john.doe@example.com</Text>
            </View>
            <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="pencil" size={18} color="#3a383a" />
            </Pressable>
          </View>

          {/* Account Settings */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#6b696b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            Account
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#eceae6', paddingLeft: 8, overflow: 'hidden', marginBottom: 24 }}>
            <SettingsRow icon="cube-outline" title="My Orders" onPress={() => router.push('/profile/orders' as any)} />
            <SettingsRow icon="heart-outline" title="Wishlist" onPress={() => router.push('/profile/wishlist' as any)} />
            <SettingsRow icon="location-outline" title="Shipping Addresses" onPress={() => router.push('/profile/addresses' as any)} />
            <SettingsRow icon="card-outline" title="Payment Methods" onPress={() => router.push('/profile/payments' as any)} />
          </View>

          {/* App Settings */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#6b696b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            App Settings
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#eceae6', paddingLeft: 8, overflow: 'hidden', marginBottom: 32 }}>
            <SettingsRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/profile/notifications' as any)} />
            <SettingsRow icon="color-palette-outline" title="Appearance" onPress={() => router.push('/profile/appearance' as any)} />
            <SettingsRow icon="help-circle-outline" title="Help & Support" onPress={() => router.push('/profile/support' as any)} />
          </View>

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? '#d9365110' : '#ffffff',
              paddingVertical: 16, borderRadius: 16,
              borderWidth: 1, borderColor: '#d9365140',
            }]}
            onPress={() => { }}
          >
            <Ionicons name="log-out-outline" size={20} color="#d93651" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#d93651' }}>Log Out</Text>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
