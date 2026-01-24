import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET reviews for a product
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Build query
        const query = { productId: new mongoose.Types.ObjectId(productId) };

        // Get total count
        const totalReviews = await Review.countDocuments(query);

        // Calculate average rating
        const ratingAgg = await Review.aggregate([
            { $match: query },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        const averageRating = ratingAgg.length > 0 ? ratingAgg[0].avgRating : 0;

        // Get paginated reviews
        const skip = (page - 1) * limit;
        const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const reviews = await Review.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                reviews,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                pagination: {
                    page,
                    limit,
                    pages: Math.ceil(totalReviews / limit),
                    hasMore: skip + reviews.length < totalReviews,
                }
            }
        });
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

// POST new review
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Get user from JWT
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, rating, reviewText } = body;

        // Validation
        if (!productId || !rating || !reviewText) {
            return NextResponse.json(
                { success: false, error: 'Product ID, rating, and review text are required' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (reviewText.length < 10) {
            return NextResponse.json(
                { success: false, error: 'Review text must be at least 10 characters' },
                { status: 400 }
            );
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            productId: new mongoose.Types.ObjectId(productId),
            userId: new mongoose.Types.ObjectId(user.userId),
        });

        if (existingReview) {
            return NextResponse.json(
                { success: false, error: 'You have already reviewed this product' },
                { status: 400 }
            );
        }

        // Create new review
        const review = await Review.create({
            productId: new mongoose.Types.ObjectId(productId),
            userId: new mongoose.Types.ObjectId(user.userId),
            userName: user.email.split('@')[0], // Use email prefix as username
            rating,
            reviewText,
            isVerified: true,
        });

        return NextResponse.json({
            success: true,
            data: { review },
            message: 'Review submitted successfully'
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating review:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create review' },
            { status: 500 }
        );
    }
}
