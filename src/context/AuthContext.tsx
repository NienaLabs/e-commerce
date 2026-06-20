import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserResponse, getMe } from '../api/auth';
import { VendorDetail, getVendorMe, ApiError } from '../api/vendors';
import { router, useSegments } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useEventStore } from '../store/eventStore';

const TOKEN_KEY = 'vendor_app_token';
const VENDOR_ACCOUNT_KEY = 'vendor_has_account';

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
  signIn: async () => { },
  signOut: async () => { },
  refreshVendor: async () => { },
  updateUserName: async () => { },
  markOnboardingComplete: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorDetail | null>(null);

  // Initialise hasVendorAccount from localStorage so that on a hard refresh the routing
  // guard doesn't momentarily see hasVendorAccount=false and redirect to become-vendor.
  const persistedHasVendor = Platform.OS === 'web'
    ? (() => { try { return localStorage.getItem(VENDOR_ACCOUNT_KEY) === 'true'; } catch { return false; } })()
    : false;
  const [hasVendorAccount, setHasVendorAccount] = useState(persistedHasVendor);

  // Helper that sets hasVendorAccount AND persists the value to localStorage
  const setHasVendorAccountPersisted = (value: boolean) => {
    setHasVendorAccount(value);
    if (Platform.OS === 'web') {
      try {
        if (value) {
          localStorage.setItem(VENDOR_ACCOUNT_KEY, 'true');
        } else {
          localStorage.removeItem(VENDOR_ACCOUNT_KEY);
        }
      } catch { }
    }
  };

  // isLoading stays true until BOTH user AND vendor check are complete
  const [isLoading, setIsLoading] = useState(true);
  // isVendorLoading tracks whether a vendor fetch is currently in-flight
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [isSuspendedState, setIsSuspendedState] = useState(false);
  const [hasPromptedOnboarding, setHasPromptedOnboarding] = useState(false);
  // Track in-flight vendor fetches so we can cancel stale ones
  const vendorFetchId = useRef(0);
  // isInitialLoad is true until the very first loadUser() cycle completes.
  // The routing guard must never fire before this is false.
  const isInitialLoad = useRef(true);
  const segments = useSegments();

  const fetchVendor = async (authToken: string) => {
    // Increment fetch ID — if a newer fetch starts before this one finishes, discard this result
    const fetchId = ++vendorFetchId.current;
    setIsVendorLoading(true);
    try {
      const vendorData = await getVendorMe(authToken);
      if (fetchId !== vendorFetchId.current) return; // stale, discard
      setVendor(vendorData);
      setHasVendorAccountPersisted(true);
    } catch (e: any) {
      if (fetchId !== vendorFetchId.current) return; // stale, discard
      // Only clear vendor status on a definitive 404 (user genuinely has no vendor profile).
      // Network errors / 5xx / timeouts must NOT clear hasVendorAccount so a brief
      // API hiccup doesn't eject the vendor from their own dashboard.
      const isDefinitelyNoProfile =
        (e as ApiError)?.status === 404 ||
        (e?.message ?? '').toLowerCase().includes('vendor profile');
      if (isDefinitelyNoProfile) {
        setVendor(null);
        setHasVendorAccountPersisted(false);
      }
      // Otherwise keep existing state — transient error, don't redirect
    } finally {
      if (fetchId === vendorFetchId.current) setIsVendorLoading(false);
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
          } catch (e) { }

          // Switch all stores to this user's storage partition
          useCartStore.getState()._switchUser(userData.id);
          useWishlistStore.getState()._switchUser(userData.id);
          useEventStore.getState()._switchUser(userData.id);

          setTokenState(storedToken);
          setUser(userData);
          // IMPORTANT: await vendor fetch before marking loading complete.
          // This prevents the routing guard from seeing user=set, hasVendorAccount=false
          // during the brief window between setUser() and fetchVendor() resolving.
          await fetchVendor(storedToken);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        await removeToken();
      } finally {
        // Mark the initial load cycle as done, then let the routing guard run
        isInitialLoad.current = false;
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    // Never fire the routing guard until loadUser() has fully completed (including the
    // vendor fetch). isInitialLoad.current prevents redirects on intermediate renders
    // that happen while user state is being set but isLoading hasn't flipped yet.
    if (isInitialLoad.current || isLoading || isVendorLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inVendorGroup = segments[0] === 'vendor-dashboard';
    const isBecomingVendor = segments[0] === 'become-vendor';
    const isCurrentlyOnboarding = segments[0] === '(auth)' && segments[1] === 'onboarding';
    const isSuspendedScreen = segments[0] === 'suspended';

    if (isSuspendedScreen) return;

    if (!user && !inAuthGroup) {
      // Not authenticated → go to login
      router.replace('/(auth)/login');
    } else if (user) {
      if (!user.onboarding_done && !hasPromptedOnboarding && !isCurrentlyOnboarding) {
        setTimeout(() => setHasPromptedOnboarding(true), 0);
        router.replace('/(auth)/onboarding' as any);
        return;
      }

      const isAdmin = user.role === 'admin';

      if (inAuthGroup && !isCurrentlyOnboarding) {
        // Authenticated and in auth screens → redirect to appropriate home
        if (hasVendorAccount) {
          router.replace('/vendor-dashboard');
        } else {
          router.replace('/(tabs)');
        }
      } else if (inVendorGroup && !hasVendorAccount && !isAdmin) {
        // Non-admin user tries to access vendor-dashboard but has no vendor account.
        // Only redirect if we are certain there is no vendor account (not just loading).
        router.replace('/become-vendor');
      } else if (isBecomingVendor && hasVendorAccount) {
        // User already has a vendor account, redirect to dashboard
        router.replace('/vendor-dashboard');
      }
    }
  }, [user, segments, isLoading, isVendorLoading, hasVendorAccount, hasPromptedOnboarding]);

  const signIn = async (newToken: string, newUser: UserResponse) => {
    await setToken(newToken);
    // Switch all stores to this user's storage partition
    useCartStore.getState()._switchUser(newUser.id);
    useWishlistStore.getState()._switchUser(newUser.id);
    useEventStore.getState()._switchUser(newUser.id);
    setTokenState(newToken);
    setUser(newUser);
    await fetchVendor(newToken);
  };

  const signOut = async () => {
    await removeToken();
    // Switch all stores to guest (clears in-memory state)
    useCartStore.getState()._switchUser(null);
    useWishlistStore.getState()._switchUser(null);
    useEventStore.getState()._switchUser(null);
    setTokenState(null);
    setUser(null);
    setVendor(null);
    setHasVendorAccount(false);
    setHasVendorAccountPersisted(false);
    setIsSuspendedState(false);
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

