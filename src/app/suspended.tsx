import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ShieldAlert, RefreshCcw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function SuspendedScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center p-8">
        <View className="w-24 h-24 rounded-full bg-error/10 items-center justify-center mb-6">
          <ShieldAlert size={48} color="#ef4444" />
        </View>
        <Text className="text-3xl font-inter-bold text-ink mb-3 text-center">Account Suspended</Text>
        <Text className="text-base text-ink-soft text-center mb-10 font-inter-regular leading-relaxed">
          Your account has been suspended for violating our platform's Terms of Service. You cannot access your store or make purchases at this time.
        </Text>
        
        <View className="w-full space-y-4">
          <TouchableOpacity 
            onPress={handleLogout}
            className="w-full bg-surface-deep py-4 rounded-xl items-center flex-row justify-center"
          >
            <RefreshCcw size={20} color="#18181b" className="mr-2" />
            <Text className="text-ink font-inter-semibold text-lg">Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
