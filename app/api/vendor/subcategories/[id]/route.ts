import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import VendorSubcategory from '@/models/VendorSubcategory';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single subcategory
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const vendor = await getUserFromRequest(request);
        if (!vendor || vendor.role !== 'vendor') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const store = await Store.findOne({ vendorId: vendor.userId });
        if (!store) {
            return NextResponse.json(apiError('Store not found'), { status: 404 });
        }

        const subcategory = await VendorSubcategory.findOne({
            _id: id,
            storeId: store._id,
        }).populate('parentCategory', 'name slug');

        if (!subcategory) {
            return NextResponse.json(apiError('Subcategory not found'), { status: 404 });
        }

        return NextResponse.json(apiSuccess({ subcategory }), { status: 200 });
    } catch (error: any) {
        console.error('Get subcategory error:', error);
        return NextResponse.json(apiError('Failed to fetch subcategory'), { status: 500 });
    }
}

// PUT - Update subcategory
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const vendor = await getUserFromRequest(request);
        if (!vendor || vendor.role !== 'vendor') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const store = await Store.findOne({ vendorId: vendor.userId });
        if (!store) {
            return NextResponse.json(apiError('Store not found'), { status: 404 });
        }

        const subcategory = await VendorSubcategory.findOne({
            _id: id,
            storeId: store._id,
        });

        if (!subcategory) {
            return NextResponse.json(apiError('Subcategory not found'), { status: 404 });
        }

        const body = await request.json();
        const { name, isActive } = body;

        if (name) {
            // Check for duplicate name
            const existingSubcat = await VendorSubcategory.findOne({
                storeId: store._id,
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id },
            });

            if (existingSubcat) {
                return NextResponse.json(
                    apiError('Subcategory with this name already exists'),
                    { status: 400 }
                );
            }

            subcategory.name = name.trim();
        }

        if (typeof isActive === 'boolean') {
            subcategory.isActive = isActive;
        }

        await subcategory.save();

        return NextResponse.json(
            apiSuccess({ subcategory }, 'Subcategory updated successfully'),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update subcategory error:', error);
        return NextResponse.json(apiError('Failed to update subcategory'), { status: 500 });
    }
}

// DELETE - Delete subcategory
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const vendor = await getUserFromRequest(request);
        if (!vendor || vendor.role !== 'vendor') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const store = await Store.findOne({ vendorId: vendor.userId });
        if (!store) {
            return NextResponse.json(apiError('Store not found'), { status: 404 });
        }

        const subcategory = await VendorSubcategory.findOne({
            _id: id,
            storeId: store._id,
        });

        if (!subcategory) {
            return NextResponse.json(apiError('Subcategory not found'), { status: 404 });
        }

        // Check if there are products in this subcategory
        const productCount = await Product.countDocuments({ subcategory: id });
        if (productCount > 0) {
            return NextResponse.json(
                apiError(`Cannot delete subcategory with ${productCount} products. Remove products first.`),
                { status: 400 }
            );
        }

        await VendorSubcategory.deleteOne({ _id: id });

        return NextResponse.json(
            apiSuccess(null, 'Subcategory deleted successfully'),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Delete subcategory error:', error);
        return NextResponse.json(apiError('Failed to delete subcategory'), { status: 500 });
    }
}
