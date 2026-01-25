import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        apiError('Unauthorized - No token provided'),
        { status: 401 }
      );
    }

    // Verify token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const role = payload.role as string;

    // Only vendors can access this endpoint
    if (role !== 'vendor') {
      return NextResponse.json(
        apiError('Access denied - Vendor only'),
        { status: 403 }
      );
    }

    await dbConnect();

    // Find store by vendorId
    const store = await Store.findOne({ vendorId: userId }).populate('category');

    if (!store) {
      // Vendor registered but hasn't created store yet - return 404 error
      return NextResponse.json(
        apiError('Vendor profile not found'),
        { status: 404 }
      );
    }

    // Fetch vendor's products (if needed)
    const products: any[] = []; // TODO: Implement product fetching when Product model is available

    return NextResponse.json(
      apiSuccess({
        vendor: store,
        products: products,
        analytics: store.analytics
      }, 'Vendor profile fetched successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get vendor store error:', error);

    if (error.name === 'JWTExpired') {
      return NextResponse.json(
        apiError('Token expired'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      apiError('Failed to fetch vendor store'),
      { status: 500 }
    );
  }
}
