'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const addToWishlistSchema = z.object({
    productId: z.string(),
});

export async function addToWishlistAction(formData: FormData) {
    try {
        const rawData = {
            productId: formData.get('productId') as string,
        };

        const validated = addToWishlistSchema.parse(rawData);

        const cookieStore = await cookies();
        const wishlistCookie = cookieStore.get('wishlist')?.value;
        const wishlist = wishlistCookie ? JSON.parse(wishlistCookie) : [];

        // Add if not already in wishlist
        if (!wishlist.includes(validated.productId)) {
            wishlist.push(validated.productId);
        }

        cookieStore.set('wishlist', JSON.stringify(wishlist), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });

        revalidatePath('/wishlist');

        return {
            success: true,
            message: 'Added to wishlist',
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Add to wishlist error:', error);
        return { success: false, error: 'Failed to add to wishlist' };
    }
}

export async function removeFromWishlistAction(formData: FormData) {
    try {
        const productId = formData.get('productId') as string;

        const cookieStore = await cookies();
        const wishlistCookie = cookieStore.get('wishlist')?.value;
        const wishlist = wishlistCookie ? JSON.parse(wishlistCookie) : [];

        const updatedWishlist = wishlist.filter((id: string) => id !== productId);

        cookieStore.set('wishlist', JSON.stringify(updatedWishlist), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
            path: '/',
        });

        revalidatePath('/wishlist');

        return {
            success: true,
            message: 'Removed from wishlist',
        };
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        return { success: false, error: 'Failed to remove from wishlist' };
    }
}
