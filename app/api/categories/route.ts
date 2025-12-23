import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest, hasRole } from '@/lib/auth';
import { createCategorySchema } from '@/lib/validation';

// GET - Get all categories
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get('parentOnly') === 'true';

    const query: any = { isActive: true };
    
    if (parentOnly) {
      query.parentCategory = null;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .populate('parentCategory', 'name slug');

    return NextResponse.json(
      apiSuccess({ categories }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      apiError('Failed to fetch categories'),
      { status: 500 }
    );
  }
}

// POST - Create category (Admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!hasRole(user, ['admin'])) {
      return NextResponse.json(
        apiError('Unauthorized. Only admins can create categories.'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug: validatedData.slug });
    if (existingCategory) {
      return NextResponse.json(
        apiError('Category with this slug already exists'),
        { status: 400 }
      );
    }

    const category = await Category.create(validatedData);

    return NextResponse.json(
      apiSuccess({ category }, 'Category created successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      apiError('Failed to create category'),
      { status: 500 }
    );
  }
}

