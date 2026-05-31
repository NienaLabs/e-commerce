import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, useWindowDimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import { register, login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
type AccountType = 'customer' | 'vendor';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { signIn } = useAuth();
  
  const registerMutation = useMutation({
    mutationFn: register,
  });

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      alert('Please fill out all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    try {
      // 1. Register the user
      await registerMutation.mutateAsync({
        email,
        name: fullName,
        password,
      });

      // 2. Login the user automatically
      const session = await login({ username: email, password });
      
      // 3. Get user details for context
      const { getMe } = await import('../../api/auth');
      const user = await getMe(session.token);
      
      await signIn(session.token, user);
      
      if (accountType === 'vendor') {
        router.replace('/vendor-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };
  const inputContainerStyle = (key: string) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: focusedInput === key ? colors.primary : colors.surfaceMuted,
    paddingHorizontal: 16,
    height: 56,
  });

  const inputStyle: any = {
    flex: 1,
    fontFamily: 'OpenSans_400Regular',
    fontSize: 15,
    color: colors.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>

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

            {/* Branding */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: colors.primaryGhost,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Ionicons name="flash" size={32} color={colors.primaryDim} />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.ink, marginBottom: 8 }}>
                Create Account
              </Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, textAlign: 'center' }}>
                Join thousands already on Electric.
              </Text>
            </View>

            {/* Account Type Toggle */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 10 }}>I'm signing up as a…</Text>
              <View style={{
                flexDirection: 'row',
                backgroundColor: colors.surfaceSoft,
                borderRadius: 16,
                padding: 4,
                borderWidth: 1,
                borderColor: colors.surfaceMuted,
              }}>
                {(['customer', 'vendor'] as AccountType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setAccountType(type)}
                    style={{
                      flex: 1, alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 8,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: accountType === type ? colors.ink : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={type === 'customer' ? 'person' : 'storefront'}
                      size={16}
                      color={accountType === type ? colors.primary : colors.inkGhost}
                    />
                    <Text style={{
                      fontFamily: accountType === type ? 'Inter_700Bold' : 'Inter_600SemiBold',
                      fontSize: 14,
                      color: accountType === type ? colors.surface : colors.inkGhost,
                    }}>
                      {type === 'customer' ? 'Customer' : 'Vendor'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {accountType === 'vendor' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 4 }}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.primaryDim} />
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, flex: 1 }}>
                    Vendor accounts require approval. You'll be notified within 24 hours.
                  </Text>
                </View>
              )}
            </View>

            {/* Full Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>Full Name</Text>
              <View style={inputContainerStyle('name')}>
                <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? colors.primaryDim : colors.inkGhost} style={{ marginRight: 12 }} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Your full name"
                  placeholderTextColor={colors.inkGhost}
                  autoCapitalize="words"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>Email Address</Text>
              <View style={inputContainerStyle('email')}>
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
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>Password</Text>
              <View style={inputContainerStyle('password')}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.primaryDim : colors.inkGhost} style={{ marginRight: 12 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.inkGhost}
                  secureTextEntry={!showPassword}
                  style={inputStyle}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkGhost} />
                </Pressable>
              </View>
              {/* Password strength hint */}
              {password.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  {[1, 2, 3, 4].map((level) => (
                    <View key={level} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor: password.length >= level * 3
                        ? (password.length >= 10 ? colors.success : colors.warning)
                        : colors.surfaceMuted,
                    }} />
                  ))}
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>Confirm Password</Text>
              <View style={{
                ...inputContainerStyle('confirm'),
                borderColor: confirmPassword.length > 0 && confirmPassword !== password
                  ? colors.error
                  : focusedInput === 'confirm' ? colors.primary : colors.surfaceMuted,
              }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? colors.primaryDim : colors.inkGhost} style={{ marginRight: 12 }} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.inkGhost}
                  secureTextEntry={!showConfirmPassword}
                  style={inputStyle}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkGhost} />
                </Pressable>
              </View>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Ionicons name="alert-circle" size={13} color={colors.error} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.error }}>Passwords don't match</Text>
                </View>
              )}
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleRegister}
              disabled={registerMutation.isPending}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primaryDim : colors.primary,
                borderRadius: 16,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 4,
                opacity: registerMutation.isPending ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>
                {registerMutation.isPending ? 'Creating Account...' : (accountType === 'vendor' ? 'Apply as Vendor' : 'Create Account')}
              </Text>
            </Pressable>

            {/* Terms */}
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkGhost, textAlign: 'center', lineHeight: 18, marginBottom: 28 }}>
              By signing up, you agree to our{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryDim }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryDim }}>Privacy Policy</Text>.
            </Text>

            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkSoft }}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primaryDim }}>Sign in</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
