import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CartItem {
  id: string; // unique identifier in cart (e.g. productId + attributes)
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  quantity: number;
  selectedAttributes?: Record<string, string>;
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

const GUEST_STORAGE_NAME = 'vendor-cart-storage-guest';

// Track the current storage key so we can change it per user
let currentStorageName = 'vendor-cart-storage';

/**
 * Fold a guest cart into a signed-in cart. Matching lines (same variant id)
 * have their quantities summed rather than one silently replacing the other.
 */
function mergeCarts(existing: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = [...existing];
  for (const item of incoming) {
    const match = merged.findIndex((i) => i.id === item.id);
    if (match >= 0) {
      merged[match] = { ...merged[match], quantity: merged[match].quantity + item.quantity };
    } else {
      merged.push(item);
    }
  }
  return merged;
}

const jsonStorage = createJSONStorage(() => customStorage);

// Wrap getItem to use the dynamic storage key
const userScopedStorage = jsonStorage ? {
  ...jsonStorage,
  getItem: (name: string) => jsonStorage.getItem(currentStorageName),
  setItem: (name: string, value: any) => jsonStorage.setItem(currentStorageName, value),
  removeItem: (name: string) => jsonStorage.removeItem(currentStorageName),
} : undefined;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const quantityToAdd = item.quantity ?? 1;
        // Use the provided id (which should be unique per variant combination)
        const existingItem = state.items.find((i) => i.id === item.id);
        
        if (existingItem) {
          // If the exact variant already exists in the cart, increase its quantity
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
        const previousName = currentStorageName;
        const nextName = userId
          ? `vendor-cart-storage-${userId}`
          : 'vendor-cart-storage-guest';

        if (previousName === nextName) return;

        // Anything sitting in the guest cart was put there by the person who
        // just signed in, so it has to travel with them. Previously the key
        // simply changed and those items were stranded in the guest bucket —
        // from the shopper's side the cart looked emptied by logging in.
        const carryOver = userId && previousName === GUEST_STORAGE_NAME ? get().items : [];

        currentStorageName = nextName;

        // Read the target partition ourselves instead of clearing state and
        // asking persist to refill it.
        //
        // The obvious version — set({ items: [] }) then rehydrate() — destroys
        // the cart it is trying to load. The middleware persists on *every*
        // set, and currentStorageName already points at the new partition, so
        // the clear writes [] straight over the stored cart; rehydrate then
        // faithfully reads back the empty array it just caused. A signed-in
        // shopper lost their cart on every single launch.
        void (async () => {
          let stored: CartItem[] = [];
          try {
            const raw = await customStorage.getItem(nextName);
            if (raw) stored = JSON.parse(raw)?.state?.items ?? [];
          } catch {
            // Unreadable or malformed partition — start empty rather than throw.
            stored = [];
          }

          set({ items: carryOver.length ? mergeCarts(stored, carryOver) : stored });

          if (carryOver.length) {
            // Empty the guest bucket so the next signed-out shopper starts
            // clean and these items can't be merged in a second time.
            void customStorage.removeItem(GUEST_STORAGE_NAME);
          }
        })();
      },
    }),
    {
      name: 'vendor-cart-storage', // default name; overridden dynamically via userScopedStorage
      storage: userScopedStorage,
    }
  )
);
