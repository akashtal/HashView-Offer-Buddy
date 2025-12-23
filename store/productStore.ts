import { create } from 'zustand';
import axios from 'axios';

interface Product {
  _id: string;
  title: string;
  description: string;
  images: string[];
  category: any;
  price?: {
    original?: number;
    discounted?: number;
    currency: string;
  };
  offer?: any;
  vendorId: any;
  distance?: number;
  analytics: {
    views: number;
    contacts: number;
  };
}

interface ProductFilters {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  hasOffer?: boolean;
  sortBy?: 'newest' | 'popular' | 'distance' | 'price';
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: ProductFilters;
  fetchProducts: (
    latitude: number,
    longitude: number,
    radius: number,
    filters?: ProductFilters,
    page?: number
  ) => Promise<void>;
  fetchFeaturedProducts: (latitude: number, longitude: number, radius: number) => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  trackView: (productId: string, userLocation?: [number, number]) => Promise<void>;
  trackContact: (
    productId: string,
    type: 'contact' | 'call' | 'whatsapp' | 'directions',
    userLocation?: [number, number]
  ) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  featuredProducts: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},

  fetchProducts: async (
    latitude: number,
    longitude: number,
    radius: number,
    filters: ProductFilters = {},
    page: number = 1
  ) => {
    try {
      set({ isLoading: true, error: null });

      const params: any = {
        latitude,
        longitude,
        radius,
        page,
        limit: 20,
        ...filters,
      };

      const response = await axios.get('/api/products', { params });

      set({
        products: response.data.data.products,
        pagination: response.data.data.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  fetchFeaturedProducts: async (
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    try {
      const response = await axios.get('/api/products', {
        params: {
          latitude,
          longitude,
          radius,
          hasOffer: true,
          sortBy: 'popular',
          limit: 10,
        },
      });

      set({
        featuredProducts: response.data.data.products,
      });
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    }
  },

  setFilters: (filters: ProductFilters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  trackView: async (productId: string, userLocation?: [number, number]) => {
    try {
      await axios.post(`/api/products/${productId}/track`, {
        type: 'view',
        userLocation: userLocation
          ? { coordinates: userLocation }
          : undefined,
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  },

  trackContact: async (
    productId: string,
    type: 'contact' | 'call' | 'whatsapp' | 'directions',
    userLocation?: [number, number]
  ) => {
    try {
      await axios.post(`/api/products/${productId}/track`, {
        type,
        userLocation: userLocation
          ? { coordinates: userLocation }
          : undefined,
      });
    } catch (error) {
      console.error('Failed to track contact:', error);
    }
  },
}));

