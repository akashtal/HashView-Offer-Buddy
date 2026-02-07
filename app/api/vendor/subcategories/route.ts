import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import VendorSubcategory from '@/models/VendorSubcategory';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';

// GET - List vendor's subcategories
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const vendor = await getUserFromRequest(request);
        if (!vendor || vendor.role !== 'vendor') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const store = await Store.findOne({ vendorId: vendor.userId });
        if (!store) {
            return NextResponse.json(apiError('Store not found'), { status: 404 });
        }

        const subcategories = await VendorSubcategory.find({ storeId: store._id })
            .populate('parentCategory', 'name slug')
            .sort({ createdAt: -1 });

        return NextResponse.json(
            apiSuccess({
                subcategories,
                limits: store.limits,
                usage: {
                    subcategoriesUsed: subcategories.length,
                    maxSubcategories: store.limits?.maxSubcategories || 5,
                },
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get subcategories error:', error);
        return NextResponse.json(apiError('Failed to fetch subcategories'), { status: 500 });
    }
}

// POST - Create new subcategory
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const vendor = await getUserFromRequest(request);
        if (!vendor || vendor.role !== 'vendor') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const store = await Store.findOne({ vendorId: vendor.userId });
        if (!store) {
            return NextResponse.json(apiError('Store not found'), { status: 404 });
        }

        const body = await request.json();
        const { name, parentCategory } = body;

        if (!name || !parentCategory) {
            return NextResponse.json(
                apiError('Name and parent category are required'),
                { status: 400 }
            );
        }

        // Check subcategory limit
        const existingCount = await VendorSubcategory.countDocuments({ storeId: store._id });
        const maxSubcategories = store.limits?.maxSubcategories || 5;

        if (existingCount >= maxSubcategories) {
            return NextResponse.json(
                apiError(`You have reached your subcategory limit of ${maxSubcategories}. Contact admin to increase.`),
                { status: 403 }
            );
        }

        // Check for duplicate name
        const existingSubcat = await VendorSubcategory.findOne({
            storeId: store._id,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        if (existingSubcat) {
            return NextResponse.json(
                apiError('Subcategory with this name already exists'),
                { status: 400 }
            );
        }

        const slug = name.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const subcategory = await VendorSubcategory.create({
            storeId: store._id,
            name: name.trim(),
            slug,
            parentCategory,
        });

        return NextResponse.json(
            apiSuccess({ subcategory }, 'Subcategory created successfully'),
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create subcategory error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                apiError('Subcategory with this name already exists'),
                { status: 400 }
            );
        }

        return NextResponse.json(apiError('Failed to create subcategory'), { status: 500 });
    }
}
