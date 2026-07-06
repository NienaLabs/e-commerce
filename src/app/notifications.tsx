import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, markAsRead, markAllAsRead, isLoading, unreadCount, pushPermissionStatus, requestPushPermission } = useNotifications();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.ink} />
            </Pressable>
          ),
          headerRight: () => unreadCount > 0 ? (
            <Pressable onPress={markAllAsRead} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary }}>Mark all read</Text>
            </Pressable>
          ) : null,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {pushPermissionStatus === 'default' && (
          <View style={{ backgroundColor: colors.primary + '15', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '40', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="notifications-circle" size={40} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Enable Push Notifications</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>Don't miss important updates about orders.</Text>
            </View>
            <Pressable 
              onPress={requestPushPermission}
              style={({ pressed }) => [{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                opacity: pressed ? 0.8 : 1
              }]}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>Allow</Text>
            </Pressable>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <Ionicons name="notifications-off-outline" size={80} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 8 }}>
              No Notifications Yet
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center' }}>
              We'll let you know when there are updates to your orders or special offers.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            </View>

            {notifications.map((notif) => (
              <Pressable
                key={notif.id}
                onPress={() => markAsRead(notif.id)}
                style={({ pressed }) => [{
                  backgroundColor: notif.is_read ? colors.surfaceSoft : colors.surface,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: notif.is_read ? 'transparent' : colors.primary + '40', // 40 is hex opacity
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: notif.is_read ? 0 : (colors.isDark ? 0.3 : 0.05),
                  shadowRadius: 8,
                  elevation: notif.is_read ? 0 : 2,
                  opacity: pressed ? 0.8 : 1,
                  flexDirection: 'row',
                }]}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: notif.is_read ? colors.surfaceMuted : colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                   <Ionicons name="notifications" size={20} color={notif.is_read ? colors.inkMuted : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: notif.is_read ? colors.inkSoft : colors.ink, marginBottom: 4 }}>
                    {notif.title}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 20 }}>
                    {notif.body}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 8 }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </Text>
                </View>
                {!notif.is_read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, alignSelf: 'center', marginLeft: 8 }} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
