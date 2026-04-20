import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

/**
 * POST /api/vendors/me/heartbeat
 * Updates lastActive timestamp for the authenticated vendor.
 * Call this whenever the vendor opens the dashboard (web or mobile).
 * If the vendor was locked, this does NOT automatically unlock — use /unlock for that.
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

    // Only refresh lastActive if the vendor is NOT locked.
    // Locked vendors must explicitly unlock to reset their timer.
    const store = await Store.findOneAndUpdate(
      { vendorId: userId, isLocked: false },
      { $set: { lastActive: new Date() } },
      { new: true, select: 'isLocked lastActive' }
    ) || await Store.findOne({ vendorId: userId }).select('isLocked lastActive');

    if (!store) {
      return NextResponse.json(apiError('Vendor profile not found'), { status: 404 });
    }

    return NextResponse.json(
      apiSuccess({ isLocked: store.isLocked, lastActive: store.lastActive }, 'Activity updated'),
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'JWTExpired') {
      return NextResponse.json(apiError('Token expired'), { status: 401 });
    }
    console.error('[Heartbeat] Error:', error);
    return NextResponse.json(apiError('Failed to update activity'), { status: 500 });
  }
}
