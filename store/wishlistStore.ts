import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
    items: string[]; // Array of product IDs
    toggleItem: (productId: string) => void;
    isLiked: (productId: string) => boolean;
    clearWishlist: () => void;
    getCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],

            toggleItem: (productId) => {
                set((state) => {
                    const isLiked = state.items.includes(productId);

                    if (isLiked) {
                        // Remove from wishlist
                        return {
                            items: state.items.filter((id) => id !== productId),
                        };
                    }

                    // Add to wishlist
                    return {
                        items: [...state.items, productId],
                    };
                });
            },

            isLiked: (productId) => {
                return get().items.includes(productId);
            },

            clearWishlist: () => {
                set({ items: [] });
            },

            getCount: () => {
                return get().items.length;
            },
        }),
        {
            name: 'wishlist-storage',
        }
    )
);
