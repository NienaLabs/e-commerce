import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  _switchUser: (userId: string | null) => void;
}

// Custom storage wrapper to handle both Web (localStorage) and Native (AsyncStorage) smoothly
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
let currentStorageName = 'vendor-cart-storage';

const jsonStorage = createJSONStorage(() => customStorage);

// Wrap getItem to use the dynamic storage key
const userScopedStorage = {
  ...jsonStorage,
  getItem: (name: string) => jsonStorage.getItem!(currentStorageName),
  setItem: (name: string, value: any) => jsonStorage.setItem!(currentStorageName, value),
  removeItem: (name: string) => jsonStorage.removeItem!(currentStorageName),
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const quantityToAdd = item.quantity ?? 1;
        const existingItem = state.items.find((i) => i.id === item.id);
        
        if (existingItem) {
          // If the item already exists in the cart, increase its quantity
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
            ),
          };
        }
        
        // Add new item to cart
        return { items: [...state.items, { ...item, quantity: quantityToAdd }] };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
        ),
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.salePrice !== undefined ? item.salePrice : item.price;
          return sum + (price * item.quantity);
        }, 0);
      },

      _switchUser: (userId: string | null) => {
        // Update the storage key to be user-scoped
        currentStorageName = userId
          ? `vendor-cart-storage-${userId}`
          : 'vendor-cart-storage-guest';
        // Clear in-memory state first
        set({ items: [] });
        // Rehydrate from the new user-scoped storage
        useCartStore.persist.rehydrate();
      },
    }),
    {
      name: 'vendor-cart-storage', // default name; overridden dynamically via userScopedStorage
      storage: userScopedStorage,
    }
  )
);
