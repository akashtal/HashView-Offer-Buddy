'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Cart is typically stored in cookies or localStorage on client
// For server actions, we'll use cookies

const addToCartSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1).default(1),
});

export async function addToCartAction(formData: FormData) {
    try {
        const rawData = {
            productId: formData.get('productId') as string,
            quantity: Number(formData.get('quantity') || 1),
        };

        const validated = addToCartSchema.parse(rawData);

        const cookieStore = await cookies();
        const cartCookie = cookieStore.get('cart')?.value;
        const cart = cartCookie ? JSON.parse(cartCookie) : [];

        // Check if product already in cart
        const existingIndex = cart.findIndex((item: any) => item.productId === validated.productId);

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += validated.quantity;
        } else {
            cart.push(validated);
        }

        // Set updated cart cookie
        cookieStore.set('cart', JSON.stringify(cart), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        revalidatePath('/cart');

        return {
            success: true,
            message: 'Added to cart',
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Add to cart error:', error);
        return { success: false, error: 'Failed to add to cart' };
    }
}

export async function removeFromCartAction(formData: FormData) {
    try {
        const productId = formData.get('productId') as string;

        const cookieStore = await cookies();
        const cartCookie = cookieStore.get('cart')?.value;
        const cart = cartCookie ? JSON.parse(cartCookie) : [];

        const updatedCart = cart.filter((item: any) => item.productId !== productId);

        cookieStore.set('cart', JSON.stringify(updatedCart), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        revalidatePath('/cart');

        return {
            success: true,
            message: 'Removed from cart',
        };
    } catch (error) {
        console.error('Remove from cart error:', error);
        return { success: false, error: 'Failed to remove from cart' };
    }
}

export async function updateCartItemAction(formData: FormData) {
    try {
        const productId = formData.get('productId') as string;
        const quantity = Number(formData.get('quantity'));

        if (quantity < 1) {
            return { success: false, error: 'Quantity must be at least 1' };
        }

        const cookieStore = await cookies();
        const cartCookie = cookieStore.get('cart')?.value;
        const cart = cartCookie ? JSON.parse(cartCookie) : [];

        const itemIndex = cart.findIndex((item: any) => item.productId === productId);

        if (itemIndex >= 0) {
            cart[itemIndex].quantity = quantity;
        }

        cookieStore.set('cart', JSON.stringify(cart), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        revalidatePath('/cart');

        return {
            success: true,
            message: 'Cart updated',
        };
    } catch (error) {
        console.error('Update cart error:', error);
        return { success: false, error: 'Failed to update cart' };
    }
}
