 import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, useWindowDimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import { login, getGoogleLoginUrl, handleGoogleCallback } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
export default function LoginScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const { signIn } = useAuth();
  
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      // Data contains the session, let's fetch the user
      // But actually, the backend returns UserId, we could set the token
      // and AuthContext will fetch the user if we just call signIn with token.
      // Wait, signIn expects (token, user). Let's fetch user in loginMutation or
      // let AuthContext handle it.
      // A simple way is to reload the app or call AuthContext.
      // Let's import getMe from api/auth.ts to fetch user here.
    },
  });

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      const { getMe } = await import('../../api/auth');
      const session = await login({ username: email, password });
      const user = await getMe(session.token);
      await signIn(session.token, user);
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const authUrl = await getGoogleLoginUrl();
      const redirectUri = Linking.createURL('/(auth)/login');
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        // Extract the token from the redirect URL
        const parsedUrl = Linking.parse(result.url);
        const token = parsedUrl.queryParams?.token;
        
        if (token && typeof token === 'string') {
          const { getMe } = await import('../../api/auth');
          const user = await getMe(token);
          await signIn(token, user);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error(error);
      alert('Google login failed: ' + error.message);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          
          {/* Main Card Container */}
          <View style={{
            width: '100%',
            maxWidth: 440,
            alignSelf: 'center',
            padding: 32,
            backgroundColor: isDesktop ? colors.surface : 'transparent',
            borderRadius: isDesktop ? 24 : 0,
            borderWidth: isDesktop ? 1 : 0,
            borderColor: colors.surfaceMuted,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDesktop ? (colors.isDark ? 0.3 : 0.05) : 0,
            shadowRadius: 24,
            elevation: isDesktop ? 10 : 0,
          }}>
            
            {/* Branding / Icon */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: colors.primaryGhost,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Ionicons name="flash" size={32} color={colors.primaryDim} />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.ink, marginBottom: 8 }}>
                Welcome Back
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center' }}>
                Sign in to continue to Electric.
              </Text>
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>Email Address</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedInput === 'email' ? colors.primary : colors.surfaceMuted,
                paddingHorizontal: 16,
                height: 56,
              }}>
                <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.primaryDim : colors.inkGhost} style={{ marginRight: 12 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.inkGhost}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>Password</Text>
                <Pressable onPress={() => {}}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primaryDim }}>Forgot?</Text>
                </Pressable>
              </View>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedInput === 'password' ? colors.primary : colors.surfaceMuted,
                paddingHorizontal: 16,
                height: 56,
              }}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.primaryDim : colors.inkGhost} style={{ marginRight: 12 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.inkGhost}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.inkGhost} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDim : colors.primary,
                borderRadius: 16,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 4,
                opacity: loginMutation.isPending ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Social Logins */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.surfaceMuted }} />
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, paddingHorizontal: 16 }}>Or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.surfaceMuted }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
              <Pressable 
                onPress={handleGoogleLogin}
                style={({ pressed }) => ({
                flex: 1, height: 48, borderRadius: 14,
                backgroundColor: colors.surface,
                borderWidth: 1, borderColor: colors.surfaceMuted,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 10,
                opacity: pressed ? 0.7 : 1,
              })}>
                <Ionicons name="logo-google" size={18} color={colors.ink} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Google</Text>
              </Pressable>
              <Pressable style={({ pressed }) => ({
                flex: 1, height: 48, borderRadius: 14,
                backgroundColor: colors.surface,
                borderWidth: 1, borderColor: colors.surfaceMuted,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 10,
                opacity: pressed ? 0.7 : 1,
              })}>
                <Ionicons name="logo-apple" size={18} color={colors.ink} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink }}>Apple</Text>
              </Pressable>
            </View>

            {/* Signup Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkSoft }}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primaryDim }}>Sign up</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
