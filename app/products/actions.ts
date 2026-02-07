'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Review from '@/models/Review';
import { getUserFromRequest } from '@/lib/auth';
import { cookies } from 'next/headers';

// Validation schemas
const submitReviewSchema = z.object({
    productId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10, 'Review must be at least 10 characters'),
});

export async function submitReviewAction(formData: FormData) {
    try {
        await dbConnect();

        // Get user from cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return { success: false, error: 'Please sign in to submit a review' };
        }

        // Mock user extraction (getUserFromRequest needs to be adapted for server actions)
        // For now, we'll use a simplified approach
        const rawData = {
            productId: formData.get('productId') as string,
            rating: Number(formData.get('rating')),
            comment: formData.get('comment') as string,
        };

        const validated = submitReviewSchema.parse(rawData);

        // Create review
        const review = await Review.create({
            product: validated.productId,
            user: formData.get('userId'), // Should extract from token
            rating: validated.rating,
            comment: validated.comment,
        });

        // Update product rating
        const reviews = await Review.find({ product: validated.productId });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(validated.productId, {
            'analytics.averageRating': avgRating,
            'analytics.totalReviews': reviews.length,
        });

        return {
            success: true,
            data: { review: JSON.parse(JSON.stringify(review)) },
            message: 'Review submitted successfully',
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Submit review error:', error);
        return { success: false, error: 'Failed to submit review' };
    }
}
