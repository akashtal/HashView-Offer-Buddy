import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest, hasRole } from '@/lib/auth';

// GET - Get all vendors (Admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!hasRole(user, ['admin'])) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    
    if (status === 'pending') {
      query.isApproved = false;
      query.isActive = true;
    } else if (status === 'approved') {
      query.isApproved = true;
      query.isActive = true;
    }

    const vendors = await Vendor.find(query)
      .populate('category', 'name slug')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Vendor.countDocuments(query);

    return NextResponse.json(
      apiSuccess({
        vendors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json(
      apiError('Failed to fetch vendors'),
      { status: 500 }
    );
  }
}

