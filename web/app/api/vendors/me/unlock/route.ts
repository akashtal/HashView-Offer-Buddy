import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

/**
 * POST /api/vendors/me/unlock
 * Unlocks a locked vendor profile by resetting lastActive to now and isLocked to false.
 * The vendor immediately becomes visible again in public listings.
 */
export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(apiError('Unauthorized'), { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const role = payload.role as string;

    if (role !== 'vendor') {
      return NextResponse.json(apiError('Access denied - Vendor only'), { status: 403 });
    }

    await dbConnect();

    const store = await Store.findOneAndUpdate(
      { vendorId: userId },
      { $set: { isLocked: false, lastActive: new Date() } },
      { new: true, select: 'isLocked lastActive shopName' }
    );

    if (!store) {
      return NextResponse.json(apiError('Vendor profile not found'), { status: 404 });
    }

    return NextResponse.json(
      apiSuccess(
        { isLocked: store.isLocked, lastActive: store.lastActive },
        'Profile unlocked successfully! Your shop is now visible to customers.'
      ),
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'JWTExpired') {
      return NextResponse.json(apiError('Token expired'), { status: 401 });
    }
    console.error('[Unlock] Error:', error);
    return NextResponse.json(apiError('Failed to unlock profile'), { status: 500 });
  }
}
