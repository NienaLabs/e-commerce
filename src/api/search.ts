const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost';

export interface ProductSuggestion {
  suggestions: string[];
  vendors?: any[];
}

export interface SearchHit {
  document: {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price?: number;
    image_url?: string;
    category_id: string;
    vendor_id: string;
    is_active: boolean;
    avg_rating?: number;
    view_count?: number;
    category_name?: string;
  };
  highlights: any[];
}

export interface SearchResponse {
  facet_counts: any[];
  found: number;
  hits: SearchHit[];
  out_of: number;
  page: number;
  request_params: {
    collection_name: string;
    per_page: number;
    q: string;
  };
  search_time_ms: number;
}

export async function fetchTrendingSearches(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search/trending`);
    if (!response.ok) {
      throw new Error('Failed to fetch trending searches');
    }
    const data = await response.json();
    return data.trending || [];
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    return [];
  }
}

export async function fetchSuggestions(query: string): Promise<{ suggestions: string[], vendors: any[] }> {
  if (!query) return { suggestions: [], vendors: [] };
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    const data: ProductSuggestion = await response.json();
    return {
      suggestions: data.suggestions || [],
      vendors: data.vendors || []
    };
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return { suggestions: [], vendors: [] };
  }
}

export async function fetchSearchResults(query: string, page: number = 1): Promise<SearchResponse | null> {
  if (!query) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/search/products?q=${encodeURIComponent(query)}&page=${page}`);
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    const data: SearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching search results:', error);
    return null;
  }
}

export async function fetchVendorSearchResults(query: string, page: number = 1): Promise<any | null> {
  if (!query) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/search/vendors?q=${encodeURIComponent(query)}&page=${page}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor search results');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vendor search results:', error);
    return null;
  }
}
