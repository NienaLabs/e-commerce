import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalOrderItem {
  id: string;
  product_id: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unit_price: number;
  discount_price?: number | null;
}

export interface LocalOrder {
  id: string;
  ref: string; // e.g. EL-88942
  status: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  discount_amount: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
  };
  payment: {
    type: string;
    last4: string;
  };
  items: LocalOrderItem[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = '@local_orders';

export async function getLocalOrders(): Promise<LocalOrder[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const orders: LocalOrder[] = data ? JSON.parse(data) : [];
    // Sort newest first
    return orders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export async function saveLocalOrder(order: LocalOrder): Promise<void> {
  try {
    const existing = await getLocalOrders();
    existing.unshift(order);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save local order', e);
  }
}
