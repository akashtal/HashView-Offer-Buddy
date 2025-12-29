import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';

// PUT - Update Category (Admin Only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const user = await getUserFromRequest(request);

        if (!user || user.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 403 });
        }

        const body = await request.json();
        const category = await Category.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });

        if (!category) {
            return NextResponse.json(apiError('Category not found'), { status: 404 });
        }

        return NextResponse.json(apiSuccess({ category }, 'Category updated'), { status: 200 });
    } catch (error) {
        return NextResponse.json(apiError('Failed to update category'), { status: 500 });
    }
}

// DELETE - Delete Category (Admin Only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const user = await getUserFromRequest(request);

        if (!user || user.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 403 });
        }

        const category = await Category.findByIdAndDelete(params.id);
        if (!category) {
            return NextResponse.json(apiError('Category not found'), { status: 404 });
        }

        return NextResponse.json(apiSuccess(null, 'Category deleted'), { status: 200 });
    } catch (error) {
        return NextResponse.json(apiError('Failed to delete category'), { status: 500 });
    }
}
