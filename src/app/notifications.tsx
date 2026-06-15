import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore } from '../store/notificationStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

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
          headerRight: () => notifications.length > 0 ? (
            <Pressable onPress={markAllAsRead} style={{ padding: 8 }}>
              <Ionicons name="checkmark-done-outline" size={24} color={colors.primary} />
            </Pressable>
          ) : null,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
               <Pressable onPress={clearAll}>
                 <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted }}>Clear All</Text>
               </Pressable>
            </View>

            {notifications.map((notif) => (
              <Pressable
                key={notif.id}
                onPress={() => markAsRead(notif.id)}
                style={({ pressed }) => [{
                  backgroundColor: notif.read ? colors.surfaceSoft : colors.surface,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: notif.read ? 'transparent' : colors.primary + '40', // 40 is hex opacity
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: notif.read ? 0 : (colors.isDark ? 0.3 : 0.05),
                  shadowRadius: 8,
                  elevation: notif.read ? 0 : 2,
                  opacity: pressed ? 0.8 : 1,
                  flexDirection: 'row',
                }]}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: notif.read ? colors.surfaceMuted : colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                   <Ionicons name="notifications" size={20} color={notif.read ? colors.inkMuted : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: notif.read ? colors.inkSoft : colors.ink, marginBottom: 4 }}>
                    {notif.title}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, lineHeight: 20 }}>
                    {notif.body}
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 8 }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </Text>
                </View>
                {!notif.read && (
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
