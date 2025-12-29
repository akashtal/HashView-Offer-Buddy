import { create } from 'zustand';
import axios from 'axios';

interface AdminState {
    users: any[];
    vendors: any[];
    products: any[];
    categories: any[];
    stats: any | null;
    isLoading: boolean;
    error: string | null;

    // Fetch Actions
    fetchStats: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchVendors: (status?: string) => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchCategories: () => Promise<void>;

    // User Actions
    deleteUser: (id: string) => Promise<void>;
    updateUserRole: (id: string, role: string) => Promise<void>;

    // Vendor Actions
    approveVendor: (id: string) => Promise<void>;
    rejectVendor: (id: string) => Promise<void>;
    updateVendor: (id: string, data: any) => Promise<void>;
    hardDeleteVendor: (id: string) => Promise<void>;
    toggleVendorStatus: (id: string, isActive: boolean) => Promise<void>;

    // Product Actions
    deleteProduct: (id: string) => Promise<void>;

    // Category Actions
    createCategory: (data: any) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
    users: [],
    vendors: [],
    products: [],
    categories: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchStats: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await axios.get('/api/admin/stats');
            set({ stats: res.data.data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchUsers: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await axios.get('/api/admin/users');
            set({ users: res.data.data.users });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchVendors: async (status) => {
        try {
            set({ isLoading: true, error: null });
            const url = status ? `/api/admin/vendors?status=${status}` : '/api/admin/vendors';
            const res = await axios.get(url);
            set({ vendors: res.data.data.vendors });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProducts: async () => {
        try {
            set({ isLoading: true, error: null });
            // Fetch all products for admin
            const res = await axios.get('/api/products?limit=100&sortBy=newest');
            set({ products: res.data.data.products });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchCategories: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await axios.get('/api/categories');
            set({ categories: res.data.data.categories });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteUser: async (id) => {
        try {
            await axios.delete(`/api/admin/users/${id}`);
            set(state => ({ users: state.users.filter(u => u._id !== id) }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateUserRole: async (id, role) => {
        try {
            await axios.put(`/api/admin/users/${id}`, { role });
            set(state => ({
                users: state.users.map(u => u._id === id ? { ...u, role } : u)
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    approveVendor: async (id) => {
        try {
            await axios.post(`/api/admin/vendors/${id}/approve`);
            set(state => ({
                vendors: state.vendors.map(v => v._id === id ? { ...v, isApproved: true } : v)
            }));
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    rejectVendor: async (id) => {
        try {
            // Updated to use PATCH for soft delete / suspend or DELETE for hard delete based on UI choice. 
            // Keeping reject as soft delete (isActive: false) + isApproved: false for now, or maybe just hard delete?
            // Let's make rejectVendor strictly about isApproved=false?
            // Actually, per requirement "delete, edit, suspend", let's separate them.
            // OLD reject was DELETE /api/vendors/:id which was soft delete.

            // Let's implement specific actions now.
            await axios.patch(`/api/admin/vendors/${id}`, { isApproved: false, isActive: false });
            set(state => ({
                vendors: state.vendors.map(v => v._id === id ? { ...v, isApproved: false, isActive: false } : v)
            }));
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateVendor: async (id, data) => {
        try {
            const res = await axios.put(`/api/admin/vendors/${id}`, data);
            set(state => ({
                vendors: state.vendors.map(v => v._id === id ? res.data.data.vendor : v)
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    hardDeleteVendor: async (id) => {
        try {
            await axios.delete(`/api/admin/vendors/${id}`);
            set(state => ({ vendors: state.vendors.filter(v => v._id !== id) }));
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    toggleVendorStatus: async (id, isActive) => {
        try {
            const res = await axios.patch(`/api/admin/vendors/${id}`, { isActive });
            set(state => ({
                vendors: state.vendors.map(v => v._id === id ? res.data.data.vendor : v)
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            await axios.delete(`/api/products/${id}`);
            set(state => ({ products: state.products.filter(p => p._id !== id) }));
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    createCategory: async (data) => {
        try {
            const res = await axios.post('/api/categories', data);
            set(state => ({ categories: [...state.categories, res.data.data.category] }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            await axios.delete(`/api/categories/${id}`);
            set(state => ({ categories: state.categories.filter(c => c._id !== id) }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    }
}));
