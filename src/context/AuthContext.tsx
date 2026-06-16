import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserResponse, getMe } from '../api/auth';
import { VendorDetail, getVendorMe } from '../api/vendors';
import { router, useSegments } from 'expo-router';

const TOKEN_KEY = 'vendor_app_token';

async function setToken(token: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function getToken() {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }
}

async function removeToken() {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  vendor: VendorDetail | null;
  hasVendorAccount: boolean;
  isLoading: boolean;
  signIn: (token: string, user: UserResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshVendor: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  markOnboardingComplete: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  vendor: null,
  hasVendorAccount: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshVendor: async () => {},
  updateUserName: async () => {},
  markOnboardingComplete: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [hasVendorAccount, setHasVendorAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPromptedOnboarding, setHasPromptedOnboarding] = useState(false);
  const segments = useSegments();

  const fetchVendor = async (authToken: string) => {
    try {
      const vendorData = await getVendorMe(authToken);
      setVendor(vendorData);
      setHasVendorAccount(true);
    } catch (e) {
      setVendor(null);
      setHasVendorAccount(false);
    }
  };

  const refreshVendor = async () => {
    if (token) {
      await fetchVendor(token);
    }
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          const userData = await getMe(storedToken);
          // Apply any local name override
          try {
            const localName = await AsyncStorage.getItem('@local_user_name');
            if (localName && userData) {
              userData.name = localName;
            }
          } catch (e) {}

          setTokenState(storedToken);
          setUser(userData);
          await fetchVendor(storedToken);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        await removeToken();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inVendorGroup = segments[0] === 'vendor-dashboard';
    const isBecomingVendor = segments[0] === 'become-vendor';
    const isCurrentlyOnboarding = segments[0] === '(auth)' && segments[1] === 'onboarding';

    if (!user && !inAuthGroup) {
      // Not authenticated → go to login
      router.replace('/(auth)/login');
    } else if (user) {
      if (!user.onboarding_done && !hasPromptedOnboarding && !isCurrentlyOnboarding) {
        setHasPromptedOnboarding(true);
        router.replace('/(auth)/onboarding');
        return;
      }

      if (inAuthGroup && !isCurrentlyOnboarding) {
        // Authenticated and in auth screens → redirect to appropriate home
        if (hasVendorAccount) {
          router.replace('/vendor-dashboard');
        } else {
          router.replace('/(tabs)');
        }
      } else if (inVendorGroup && !hasVendorAccount) {
        // User tries to access vendor-dashboard but has no vendor account
        router.replace('/become-vendor');
      } else if (isBecomingVendor && hasVendorAccount) {
        // User already has a vendor account, redirect to dashboard
        router.replace('/vendor-dashboard');
      }
    }
  }, [user, segments, isLoading, hasVendorAccount, hasPromptedOnboarding]);

  const signIn = async (newToken: string, newUser: UserResponse) => {
    await setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    await fetchVendor(newToken);
  };

  const signOut = async () => {
    await removeToken();
    setTokenState(null);
    setUser(null);
    setVendor(null);
    setHasVendorAccount(false);
  };

  const updateUserName = async (name: string) => {
    if (user) {
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      try {
        await AsyncStorage.setItem('@local_user_name', name);
      } catch (e) {
        console.error('Failed to save local user name', e);
      }
    }
  };

  const markOnboardingComplete = () => {
    if (user) {
      setUser({ ...user, onboarding_done: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        vendor,
        hasVendorAccount,
        isLoading,
        signIn,
        signOut,
        refreshVendor,
        updateUserName,
        markOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

