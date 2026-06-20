import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  inStock?: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  hasItem: (id: string) => boolean;
  _switchUser: (userId: string | null) => void;
}

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
    } else {
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    } else {
      await AsyncStorage.removeItem(name);
    }
  },
};

// Track the current storage key so we can change it per user
let currentStorageName = 'vendor-wishlist-storage';

const jsonStorage = createJSONStorage(() => customStorage);

// Wrap storage to use the dynamic key
const userScopedStorage = {
  ...jsonStorage,
  getItem: (name: string) => jsonStorage.getItem!(currentStorageName),
  setItem: (name: string, value: any) => jsonStorage.setItem!(currentStorageName, value),
  removeItem: (name: string) => jsonStorage.removeItem!(currentStorageName),
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      toggleItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          // Remove if it already exists
          return { items: state.items.filter((i) => i.id !== item.id) };
        }
        // Add if it doesn't exist
        return { items: [...state.items, { ...item, inStock: item.inStock ?? true }] };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      
      clearWishlist: () => set({ items: [] }),
      
      hasItem: (id) => get().items.some((i) => i.id === id),

      _switchUser: (userId: string | null) => {
        // Update the storage key to be user-scoped
        currentStorageName = userId
          ? `vendor-wishlist-storage-${userId}`
          : 'vendor-wishlist-storage-guest';
        // Clear in-memory state first
        set({ items: [] });
        // Rehydrate from the new user-scoped storage
        useWishlistStore.persist.rehydrate();
      },
    }),
    {
      name: 'vendor-wishlist-storage', // default name; overridden dynamically via userScopedStorage
      storage: userScopedStorage,
    }
  )
);
