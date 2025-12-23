import { create } from 'zustand';
import axios from 'axios';

interface Vendor {
  _id: string;
  shopName: string;
  shopDescription?: string;
  shopLogo?: string;
  shopImages?: string[];
  category: any;
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  contactInfo: {
    phone: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  businessHours?: any[];
  isApproved: boolean;
  isActive: boolean;
  rating?: number;
  totalReviews?: number;
  analytics: {
    totalViews: number;
    totalContacts: number;
    totalProducts: number;
  };
  distance?: number;
}

interface VendorState {
  currentVendor: Vendor | null;
  vendors: Vendor[];
  myVendorProfile: Vendor | null;
  myProducts: any[];
  myAnalytics: any;
  isLoading: boolean;
  error: string | null;
  fetchVendors: (
    latitude: number,
    longitude: number,
    radius: number,
    category?: string
  ) => Promise<void>;
  fetchVendorById: (id: string, userLocation?: [number, number]) => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  createVendorProfile: (data: any) => Promise<void>;
  updateVendorProfile: (id: string, data: any) => Promise<void>;
  clearCurrentVendor: () => void;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  currentVendor: null,
  vendors: [],
  myVendorProfile: null,
  myProducts: [],
  myAnalytics: null,
  isLoading: false,
  error: null,

  fetchVendors: async (
    latitude: number,
    longitude: number,
    radius: number,
    category?: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      const params: any = {
        latitude,
        longitude,
        radius,
      };

      if (category) {
        params.category = category;
      }

      const response = await axios.get('/api/vendors', { params });

      set({
        vendors: response.data.data.vendors,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch vendors',
        isLoading: false,
      });
    }
  },

  fetchVendorById: async (id: string, userLocation?: [number, number]) => {
    try {
      set({ isLoading: true, error: null });

      const params: any = {};
      if (userLocation) {
        params.userLat = userLocation[0];
        params.userLon = userLocation[1];
      }

      const response = await axios.get(`/api/vendors/${id}`, { params });

      set({
        currentVendor: response.data.data.vendor,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch vendor',
        isLoading: false,
      });
    }
  },

  fetchMyProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await axios.get('/api/vendors/me');

      set({
        myVendorProfile: response.data.data.vendor,
        myProducts: response.data.data.products,
        myAnalytics: response.data.data.analytics,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch profile',
        isLoading: false,
      });
    }
  },

  createVendorProfile: async (data: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axios.post('/api/vendors', data);

      set({
        myVendorProfile: response.data.data.vendor,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.error || 'Failed to create vendor profile'
      );
    }
  },

  updateVendorProfile: async (id: string, data: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axios.put(`/api/vendors/${id}`, data);

      set({
        myVendorProfile: response.data.data.vendor,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.error || 'Failed to update vendor profile'
      );
    }
  },

  clearCurrentVendor: () => {
    set({ currentVendor: null });
  },
}));

