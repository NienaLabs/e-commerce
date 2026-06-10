import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addRecentSearch: (query: string) =>
        set((state) => {
          const trimmedQuery = query.trim();
          if (!trimmedQuery) return state;

          const filtered = state.recentSearches.filter(
            (q) => q.toLowerCase() !== trimmedQuery.toLowerCase()
          );

          return {
            recentSearches: [trimmedQuery, ...filtered].slice(0, 10), // Keep top 10
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
