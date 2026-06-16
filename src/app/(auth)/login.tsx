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
  Animated,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useMutation } from '@tanstack/react-query';
import { login, getGoogleLoginUrl } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();

const CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&fit=crop',
];

// Auto-playing image carousel with dot indicators
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

  const advance = (next: number) => {
    const idx = next % CAROUSEL_IMAGES.length;
    setActiveIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

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

      {/* Rich multi-stop gradient: dark top vignette → transparent mid → solid bg bottom */}
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
          <Pressable key={i} onPress={() => advance(i)}>
            <View
              style={{
                height: 6,
                width: activeIndex === i ? 20 : 6,
                borderRadius: 3,
                backgroundColor:
                  activeIndex === i ? '#fff' : 'rgba(255,255,255,0.42)',
                // Smooth width transition on web; RN doesn't animate style changes by default,
                // so we use a quick Animated value for native if desired.
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Desktop-only carousel (fixed width, no FlatList paging needed)
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
        <Animated.Image
          key={i}
          source={{ uri }}
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: activeIndex === i ? 1 : 0,
              // On web, CSS transition handles the crossfade smoothly
              ...(Platform.OS === 'web'
                ? ({ transition: 'opacity 0.85s cubic-bezier(0.4,0,0.2,1)' } as any)
                : {}),
            },
          ]}
          resizeMode="cover"
        />
      ))}

      {/* Tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.04)' },
        ]}
      />

      {/* Edge-to-right gradient for seamless bleed into the form panel */}
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
          alignSelf: 'center',
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

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768 && Platform.OS === 'web';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const { signIn } = useAuth();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {},
  });

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      const { getMe } = await import('../../api/auth');
      const session = await login({ username: email, password });
      const user = await getMe(session.token);
      await signIn(session.token, user);
      if (!user.onboarding_done) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
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
        const parsedUrl = Linking.parse(result.url);
        const token = parsedUrl.queryParams?.token;
        if (token && typeof token === 'string') {
          const { getMe } = await import('../../api/auth');
          const user = await getMe(token);
          await signIn(token, user);
          if (!user.onboarding_done) {
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      alert('Google login failed: ' + error.message);
    }
  };

  const heroHeight = isDesktop ? Math.min(height * 0.45, 380) : height * 0.42;

  const bg = isDark ? '#18181a' : '#f8f8f5';
  const cardBg = isDark ? '#222022' : '#ffffff';
  const cardBorder = isDark ? '#3a383a' : '#eceae6';

  const btnGradient: [string, string, string] = [colors.primary, colors.primary, colors.primaryDim];

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
      {/* Header text */}
      <View style={{ marginBottom: 26 }}>
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 32,
            color: colors.ink,
            marginBottom: 6,
            letterSpacing: -0.8,
          }}
        >
          Welcome back
        </Text>
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 15,
            color: colors.inkMuted,
            lineHeight: 22,
          }}
        >
          Sign in to continue shopping
        </Text>
      </View>

      {/* Email Input */}
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
            borderColor:
              focusedInput === 'email'
                ? colors.primary
                : 'transparent',
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

      {/* Password Input */}
      <View style={{ marginBottom: 10 }}>
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
            borderColor:
              focusedInput === 'password'
                ? colors.primary
                : 'transparent',
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
            placeholder="Enter your password"
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
      </View>

      {/* Forgot password */}
      <View style={{ alignItems: 'flex-end', marginBottom: 26 }}>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Reset Password',
              'Please contact support at support@electric.app to reset your password.'
            )
          }
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: colors.primary,
            }}
          >
            Forgot password?
          </Text>
        </Pressable>
      </View>

      {/* Sign In Button */}
      <Pressable
        onPress={handleLogin}
        disabled={loginMutation.isPending}
        style={({ pressed }) => ({
          borderRadius: 14,
          height: 54,
          overflow: 'hidden',
          marginBottom: 20,
          shadowColor: colors.primaryDim,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.42,
          shadowRadius: 16,
          elevation: 8,
          opacity: loginMutation.isPending ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.978 : 1 }],
        })}
      >
        <LinearGradient
          colors={btnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 16,
              color: '#18181a',
              letterSpacing: 0.3,
            }}
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#3a383a' : '#e5e2dc' }} />
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 12,
            color: colors.inkGhost,
            paddingHorizontal: 14,
            letterSpacing: 0.4,
          }}
        >
          OR
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#3a383a' : '#e5e2dc' }} />
      </View>

      {/* Google Login */}
      <Pressable
        onPress={handleGoogleLogin}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: 14,
          backgroundColor: isDark ? '#2e2c2e' : '#f1f0ec',
          borderWidth: 1,
          borderColor: isDark ? '#3a383a' : '#e5e2dc',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: pressed ? 0.75 : 1,
          marginBottom: 32,
          transform: [{ scale: pressed ? 0.978 : 1 }],
        })}
      >
        <Ionicons name="logo-google" size={18} color={colors.ink} />
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 15,
            color: colors.ink,
          }}
        >
          Continue with Google
        </Text>
      </Pressable>

      {/* Sign Up Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 14,
            color: colors.inkMuted,
          }}
        >
          Don't have an account?{' '}
        </Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: colors.primary,
            }}
          >
            Create one
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, flexDirection: 'row' }}>
        {/* Left Pane: Crossfade Carousel */}
        <DesktopCarousel isDark={isDark} bg={bg} />

        {/* Right Pane: Form */}
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

  // Mobile / Stacked Layout
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
          {/* Auto-playing Carousel */}
          <ImageCarousel height={heroHeight} isDark={isDark} bg={bg} />

          {/* Form */}
          <View style={{ flex: 1, backgroundColor: bg, paddingTop: 8 }}>
            {renderForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}