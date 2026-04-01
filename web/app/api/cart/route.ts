import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import mongoose from 'mongoose';

// Validation schema for adding items
const cartItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1).default(1),
    price: z.number().min(0),
});

// GET - Fetch User's Cart
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        let cart = await Cart.findOne({ userId: user.userId }).populate({
            path: 'items.productId',
            select: 'title images vendorId' // Fetch details for display
        });

        if (!cart) {
            // Create empty cart if none exists
            cart = await Cart.create({
                userId: user.userId,
                items: [],
                totalAmount: 0
            });
        }

        // Transform populated items to match frontend expectation if needed
        // The frontend expects: title, image, vendorId. 
        // populated productId will be an object.

        return NextResponse.json(apiSuccess({ cart }), { status: 200 });

    } catch (error: any) {
        console.error('Get cart error:', error);
        return NextResponse.json(apiError('Failed to fetch cart'), { status: 500 });
    }
}

// POST - Add Item / Sync Cart
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const body = await request.json();

        // Scenario 1: Sync entire cart (e.g. from local storage on login)
        if (body.action === 'sync' && Array.isArray(body.items)) {
            // Logic to merge or replace. For simplicity, we'll merge logic here usually, 
            // but let's implement basic "Add Item" first as verified in plan.
            // If the body is just an item, we add it. 
        }

        // Default Scenario: Add/Update single item
        const validatedItem = cartItemSchema.parse(body);

        let cart = await Cart.findOne({ userId: user.userId });

        if (!cart) {
            cart = await Cart.create({
                userId: user.userId,
                items: [validatedItem],
            });
        } else {
            // Check if item exists
            const itemIndex = cart.items.findIndex(
                (item) => item.productId.toString() === validatedItem.productId
            );

            if (itemIndex > -1) {
                // Update quantity
                cart.items[itemIndex].quantity += validatedItem.quantity;
                // Optional: Update price to latest validity? Keeping original price for now or updating it?
                // Let's update price to current.
                cart.items[itemIndex].price = validatedItem.price;
            } else {
                // Add new item
                // Use mongoose types if needed, but simple object works for subdocs
                cart.items.push(validatedItem as any);
            }

            await cart.save();
        }

        return NextResponse.json(apiSuccess({ cart }), { status: 200 });

    } catch (error: any) {
        console.error('Update cart error:', error);
        return NextResponse.json(apiError('Failed to update cart'), { status: 500 });
    }
}

// DELETE - Remove Item or Clear Cart
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        let cart = await Cart.findOne({ userId: user.userId });

        if (!cart) {
            return NextResponse.json(apiError('Cart not found'), { status: 404 });
        }

        if (productId) {
            // Remove specific item
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        } else {
            // Clear all
            cart.items = [];
        }

        await cart.save();

        return NextResponse.json(apiSuccess({ cart }), { status: 200 });

    } catch (error: any) {
        console.error('Delete cart error:', error);
        return NextResponse.json(apiError('Failed to update cart'), { status: 500 });
    }
}
