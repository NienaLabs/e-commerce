import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserResponse, getMe } from '../api/auth';
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

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, user: UserResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          const userData = await getMe(storedToken);
          setTokenState(storedToken);
          setUser(userData);
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

    if (!user && !inAuthGroup) {
      // If the user is not authenticated and not in the auth group,
      // redirect them to the auth group.
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // If the user is authenticated and in the auth group,
      // redirect them to the main app.
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const signIn = async (newToken: string, newUser: UserResponse) => {
    await setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
