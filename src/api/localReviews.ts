import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

const STORAGE_KEY = '@local_reviews';

export async function getLocalReviews(productId: string): Promise<LocalReview[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const allReviews: LocalReview[] = JSON.parse(data);
    return allReviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Failed to get local reviews', error);
    return [];
  }
}

export async function addLocalReview(review: Omit<LocalReview, 'id' | 'createdAt'>): Promise<LocalReview> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const allReviews: LocalReview[] = data ? JSON.parse(data) : [];
    
    const newReview: LocalReview = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    allReviews.push(newReview);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
    return newReview;
  } catch (error) {
    console.error('Failed to add local review', error);
    throw error;
  }
}
