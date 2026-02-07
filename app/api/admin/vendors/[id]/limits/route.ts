import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT - Update vendor limits (Admin only)
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const admin = await getUserFromRequest(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const body = await request.json();
        const { maxSubcategories, maxProductsPerSubcategory } = body;

        // Validate limits
        if (maxSubcategories !== undefined && (typeof maxSubcategories !== 'number' || maxSubcategories < 1 || maxSubcategories > 100)) {
            return NextResponse.json(
                apiError('maxSubcategories must be a number between 1 and 100'),
                { status: 400 }
            );
        }

        if (maxProductsPerSubcategory !== undefined && (typeof maxProductsPerSubcategory !== 'number' || maxProductsPerSubcategory < 1 || maxProductsPerSubcategory > 500)) {
            return NextResponse.json(
                apiError('maxProductsPerSubcategory must be a number between 1 and 500'),
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (maxSubcategories !== undefined) {
            updateData['limits.maxSubcategories'] = maxSubcategories;
        }
        if (maxProductsPerSubcategory !== undefined) {
            updateData['limits.maxProductsPerSubcategory'] = maxProductsPerSubcategory;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                apiError('No valid limit values provided'),
                { status: 400 }
            );
        }

        const vendor = await Store.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!vendor) {
            return NextResponse.json(apiError('Vendor not found'), { status: 404 });
        }

        return NextResponse.json(
            apiSuccess(
                {
                    vendor: {
                        _id: vendor._id,
                        shopName: vendor.shopName,
                        limits: vendor.limits,
                    }
                },
                'Vendor limits updated successfully'
            ),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update vendor limits error:', error);
        return NextResponse.json(apiError('Failed to update vendor limits'), { status: 500 });
    }
}

// GET - Get vendor limits (Admin only)
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const admin = await getUserFromRequest(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const vendor = await Store.findById(id).select('shopName limits');
        if (!vendor) {
            return NextResponse.json(apiError('Vendor not found'), { status: 404 });
        }

        return NextResponse.json(
            apiSuccess({
                vendor: {
                    _id: vendor._id,
                    shopName: vendor.shopName,
                    limits: vendor.limits || { maxSubcategories: 5, maxProductsPerSubcategory: 20 },
                }
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get vendor limits error:', error);
        return NextResponse.json(apiError('Failed to get vendor limits'), { status: 500 });
    }
}
