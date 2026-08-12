import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useMaintenanceStore } from '../store/maintenanceStore';
import KonuraLogo from '../../assets/images/konura.svg';

/**
 * Shown while the platform is paused by an admin.
 */
export default function MaintenanceScreen() {
  const { colors } = useTheme();
  const { message, checking, recheck } = useMaintenanceStore();
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const leaveIfBackUp = React.useCallback(async () => {
    const backUp = await recheck();
    setLastCheckedAt(new Date());
    if (backUp) router.replace('/(tabs)');
  }, [recheck]);



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ marginBottom: 28, alignItems: 'center' }}>
          <KonuraLogo width={120} height={40} />
        </View>

        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.warningGhost ?? colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <Ionicons name="construct-outline" size={44} color={colors.warning ?? colors.inkMuted} />
        </View>

        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 26,
            color: colors.ink,
            textAlign: 'center',
            marginBottom: 12,
            letterSpacing: -0.4,
          }}
        >
          We&apos;ll be right back
        </Text>

        {/* Prefer the server's own wording so an admin can change the notice
            without shipping an app update. */}
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 15,
            lineHeight: 23,
            color: colors.inkMuted,
            textAlign: 'center',
            marginBottom: 32,
            maxWidth: 360,
          }}
        >
          {message ?? 'Konura is under maintenance right now. Please try again in a few minutes.'}
        </Text>

        <Pressable
          onPress={leaveIfBackUp}
          disabled={checking}
          accessibilityRole="button"
          accessibilityLabel="Check whether Konura is back online"
          accessibilityState={{ disabled: checking, busy: checking }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minWidth: 200,
            paddingHorizontal: 28,
            paddingVertical: 15,
            borderRadius: 26,
            backgroundColor: colors.primary,
            opacity: pressed || checking ? 0.75 : 1,
            ...(Platform.OS === 'web' ? {} : { elevation: 3 }),
          })}
        >
          {checking && <ActivityIndicator size="small" color={colors.onPrimary ?? colors.ink} />}
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: colors.onPrimary ?? colors.ink,
            }}
          >
            {checking ? 'Checking…' : 'Try again'}
          </Text>
        </Pressable>

        {lastCheckedAt && !checking && (
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 12,
              color: colors.inkGhost,
              marginTop: 14,
            }}
          >
            Last checked at{' '}
            {lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
