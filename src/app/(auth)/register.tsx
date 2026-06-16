import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import { register, login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

type AccountType = 'customer' | 'vendor';

const CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&fit=crop',
];

function ImageCarousel({
  height,
  isDark,
  bg,
}: {
  height: number;
  isDark: boolean;
  bg: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % CAROUSEL_IMAGES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goTo = (i: number) => {
    const idx = (i + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
    setActiveIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  return (
    <View style={{ width: '100%', height, position: 'relative' }}>
      <FlatList
        ref={flatListRef}
        data={CAROUSEL_IMAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image
              source={{ uri: item }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          </View>
        )}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* 4-stop premium gradient */}
      <LinearGradient
        colors={[
          isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.10)',
          'transparent',
          isDark ? 'rgba(24,24,26,0.55)' : 'rgba(248,248,245,0.45)',
          bg,
        ]}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dot indicators */}
      <View
        style={{
          position: 'absolute',
          bottom: 18,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {CAROUSEL_IMAGES.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)}>
            <View
              style={{
                height: 6,
                width: activeIndex === i ? 20 : 6,
                borderRadius: 3,
                backgroundColor:
                  activeIndex === i ? '#fff' : 'rgba(255,255,255,0.42)',
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DesktopCarousel({
  isDark,
  bg,
}: {
  isDark: boolean;
  bg: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(
      () => setActiveIndex((p) => (p + 1) % CAROUSEL_IMAGES.length),
      3500
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={{ width: '48%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {CAROUSEL_IMAGES.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: activeIndex === i ? 1 : 0,
              ...(Platform.OS === 'web'
                ? ({ transition: 'opacity 0.85s cubic-bezier(0.4,0,0.2,1)' } as any)
                : {}),
            },
          ]}
          resizeMode="cover"
        />
      ))}

      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.04)' },
        ]}
      />

      <LinearGradient
        colors={['transparent', 'transparent', isDark ? 'rgba(24,24,26,0.6)' : 'rgba(248,248,245,0.5)', bg]}
        locations={[0, 0.6, 0.85, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dot indicators */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 7,
        }}
      >
        {CAROUSEL_IMAGES.map((_, i) => (
          <Pressable key={i} onPress={() => setActiveIndex(i)}>
            <View
              style={{
                height: 6,
                width: activeIndex === i ? 22 : 6,
                borderRadius: 3,
                backgroundColor:
                  activeIndex === i ? '#fff' : 'rgba(255,255,255,0.40)',
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
      await registerMutation.mutateAsync({ email, name: fullName, password });

      const session = await login({ username: email, password });
      const { getMe } = await import('../../api/auth');
      const user = await getMe(session.token);

      await signIn(session.token, user);

      if (!user.onboarding_done) {
        router.replace('/(auth)/onboarding');
      } else if (accountType === 'vendor') {
        router.replace('/vendor-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const heroHeight = isDesktop ? Math.min(height * 0.45, 380) : height * 0.38;
  const bg = isDark ? '#18181a' : '#f8f8f5';

  const renderForm = () => (
    <View
      style={{
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        paddingHorizontal: isDesktop ? 0 : 28,
        paddingTop: isDesktop ? 40 : 12,
        paddingBottom: insets.bottom + 24,
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 32,
            color: colors.ink,
            marginBottom: 8,
            letterSpacing: -0.8,
          }}
        >
          Create account
        </Text>
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 15,
            color: colors.inkMuted,
            lineHeight: 22,
          }}
        >
          Join thousands shopping on Electric.
        </Text>
      </View>

      {/* Account Type Toggle */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: colors.inkSoft,
            marginBottom: 8,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          I am signing up as a…
        </Text>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
            borderRadius: 14,
            padding: 4,
            borderWidth: 1,
            borderColor: isDark ? '#3a383a' : '#e5e2dc',
          }}
        >
          {(['customer', 'vendor'] as AccountType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setAccountType(type)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: accountType === type ? colors.ink : 'transparent',
              }}
            >
              <Ionicons
                name={type === 'customer' ? 'person' : 'storefront'}
                size={16}
                color={accountType === type ? colors.primary : colors.inkGhost}
              />
              <Text
                style={{
                  fontFamily: accountType === type ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  fontSize: 14,
                  color: accountType === type ? colors.surface : colors.inkGhost,
                }}
              >
                {type === 'customer' ? 'Customer' : 'Vendor'}
              </Text>
            </Pressable>
          ))}
        </View>
        {accountType === 'vendor' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 10,
              paddingHorizontal: 4,
            }}
          >
            <Ionicons name="information-circle-outline" size={14} color={colors.primaryDim} />
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 12,
                color: colors.inkGhost,
                flex: 1,
              }}
            >
              Vendor accounts require approval. You'll be notified within 24 hours.
            </Text>
          </View>
        )}
      </View>

      {/* Full Name */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: colors.inkSoft,
            marginBottom: 8,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Full Name
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: focusedInput === 'name' ? colors.primary : 'transparent',
            paddingHorizontal: 16,
            height: 54,
          }}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={focusedInput === 'name' ? colors.primary : colors.inkGhost}
            style={{ marginRight: 12 }}
          />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Your full name"
            placeholderTextColor={colors.inkGhost}
            autoCapitalize="words"
            style={{
              flex: 1,
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: colors.ink,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />
        </View>
      </View>

      {/* Email */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: colors.inkSoft,
            marginBottom: 8,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Email
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: focusedInput === 'email' ? colors.primary : 'transparent',
            paddingHorizontal: 16,
            height: 54,
          }}
        >
          <Ionicons
            name="mail-outline"
            size={18}
            color={focusedInput === 'email' ? colors.primary : colors.inkGhost}
            style={{ marginRight: 12 }}
          />
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
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: colors.ink,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />
        </View>
      </View>

      {/* Password */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: colors.inkSoft,
            marginBottom: 8,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Password
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: focusedInput === 'password' ? colors.primary : 'transparent',
            paddingHorizontal: 16,
            height: 54,
          }}
        >
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={focusedInput === 'password' ? colors.primary : colors.inkGhost}
            style={{ marginRight: 12 }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Create a strong password"
            placeholderTextColor={colors.inkGhost}
            secureTextEntry={!showPassword}
            style={{
              flex: 1,
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: colors.ink,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkGhost}
            />
          </Pressable>
        </View>
        {password.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor:
                    password.length >= level * 3
                      ? password.length >= 10
                        ? colors.success
                        : colors.warning
                      : isDark
                      ? '#3a383a'
                      : '#eceae6',
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 28 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            color: colors.inkSoft,
            marginBottom: 8,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Confirm Password
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor:
              confirmPassword.length > 0 && confirmPassword !== password
                ? colors.error
                : focusedInput === 'confirm'
                ? colors.primary
                : 'transparent',
            paddingHorizontal: 16,
            height: 54,
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={focusedInput === 'confirm' ? colors.primary : colors.inkGhost}
            style={{ marginRight: 12 }}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
            placeholder="Repeat your password"
            placeholderTextColor={colors.inkGhost}
            secureTextEntry={!showConfirmPassword}
            style={{
              flex: 1,
              fontFamily: 'OpenSans_400Regular',
              fontSize: 15,
              color: colors.ink,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkGhost}
            />
          </Pressable>
        </View>
        {confirmPassword.length > 0 && confirmPassword !== password && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <Ionicons name="alert-circle" size={13} color={colors.error} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.error }}>
              Passwords don't match
            </Text>
          </View>
        )}
      </View>

      {/* Register Button */}
      <Pressable
        onPress={handleRegister}
        disabled={registerMutation.isPending}
        style={({ pressed }) => ({
          borderRadius: 14,
          height: 54,
          overflow: 'hidden',
          marginBottom: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.42,
          shadowRadius: 16,
          elevation: 8,
          opacity: registerMutation.isPending ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.978 : 1 }],
        })}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary, colors.primaryDim] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 16,
              color: '#18181a',
              letterSpacing: 0.2,
            }}
          >
            {registerMutation.isPending
              ? 'Creating Account...'
              : accountType === 'vendor'
              ? 'Apply as Vendor'
              : 'Create Account'}
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Terms */}
      <Text
        style={{
          fontFamily: 'OpenSans_400Regular',
          fontSize: 12,
          color: colors.inkGhost,
          textAlign: 'center',
          lineHeight: 18,
          marginBottom: 28,
        }}
      >
        By signing up, you agree to our{' '}
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryDim }}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryDim }}>
          Privacy Policy
        </Text>
        .
      </Text>

      {/* Login Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 14,
            color: colors.inkMuted,
          }}
        >
          Already have an account?{' '}
        </Text>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: colors.primaryDim,
            }}
          >
            Sign in
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, flexDirection: 'row' }}>
        <DesktopCarousel isDark={isDark} bg={bg} />
        <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center' }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: 40,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderForm()}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ImageCarousel height={heroHeight} isDark={isDark} bg={bg} />
          <View style={{ flex: 1, backgroundColor: bg, paddingTop: 8 }}>
            {renderForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}