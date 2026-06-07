import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
  defaultColor?: string;
}

const SettingsRow = ({ icon, title, onPress, color, defaultColor }: SettingsRowProps) => {
  const { colors } = useTheme();
  const activeColor = color || defaultColor || colors.inkSoft;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
        backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
      }]}
    >
      <View style={{ width: 40, alignItems: 'center' }}>
        <Ionicons name={icon} size={22} color={activeColor} />
      </View>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, flex: 1, color: activeColor }}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} style={{ marginRight: 8 }} />
    </Pressable>
  );
};

export default function Profile() {
  const { colors } = useTheme();
  const { user, signOut, hasVendorAccount, updateUserName } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editName.trim()) {
      await updateUserName(editName.trim());
    }
    setIsEditing(false);
  };

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>

          {/* Profile Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surface, padding: 20, borderRadius: 20,
            borderWidth: 1, borderColor: colors.surfaceMuted,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: colors.isDark ? 0.3 : 0.08, shadowRadius: 10, elevation: 3,
            marginBottom: 32,
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: colors.primaryGhost,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: colors.primaryBorder,
              marginRight: 20,
            }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginBottom: 4 }}>{user?.name ?? 'Guest User'}</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted }}>{user?.email ?? 'Sign in to sync your data'}</Text>
            </View>
            <Pressable 
              onPress={handleOpenEdit}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="pencil" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>

          {/* Account Settings */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            Account
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, paddingLeft: 8, overflow: 'hidden', marginBottom: 24 }}>
            <SettingsRow icon="cube-outline" title="My Orders" onPress={() => router.push('/profile/orders' as any)} />
            <SettingsRow icon="heart-outline" title="Wishlist" onPress={() => router.push('/profile/wishlist' as any)} />
            <SettingsRow icon="star-outline" title="Rewards & Loyalty" onPress={() => router.push('/rewards' as any)} />
            <SettingsRow icon="location-outline" title="Shipping Addresses" onPress={() => router.push('/profile/addresses' as any)} />
            <SettingsRow icon="card-outline" title="Payment Methods" onPress={() => router.push('/profile/payments' as any)} />
          </View>

          {/* App Settings */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 }}>
            App Settings
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceMuted, paddingLeft: 8, overflow: 'hidden', marginBottom: 32 }}>
            <SettingsRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/profile/notifications' as any)} />
            <SettingsRow icon="color-palette-outline" title="Appearance" onPress={() => router.push('/profile/appearance' as any)} />
            {hasVendorAccount ? (
              <SettingsRow icon="storefront-outline" title="Vendor Dashboard" onPress={() => router.push('/vendor-dashboard' as any)} />
            ) : (
              <SettingsRow icon="storefront-outline" title="Become a Vendor" onPress={() => router.push('/become-vendor' as any)} />
            )}
            <SettingsRow icon="help-circle-outline" title="Help & Support" onPress={() => router.push('/profile/support' as any)} />
          </View>

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? colors.errorGhost : colors.surface,
              paddingVertical: 16, borderRadius: 16,
              borderWidth: 1, borderColor: '#d9365140',
            }]}
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/login');
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#d93651" style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#d93651' }}>Log Out</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} transparent animationType="fade" onRequestClose={() => setIsEditing(false)}>
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}
          onPress={() => setIsEditing(false)}
        >
          <Pressable 
            onPress={e => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink, marginBottom: 16 }}>Edit Profile</Text>
            
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
              placeholderTextColor={colors.inkGhost}
              style={{
                backgroundColor: colors.surfaceSoft, borderRadius: 12, paddingHorizontal: 16, height: 50,
                fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
                borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 24,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable 
                onPress={() => setIsEditing(false)}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: colors.surfaceSoft }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveEdit}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: colors.ink }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.surface }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
