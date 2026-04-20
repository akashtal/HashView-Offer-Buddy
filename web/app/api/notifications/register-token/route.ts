import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import NotificationToken from '@/models/NotificationToken';
import mongoose from 'mongoose';
import { apiSuccess, apiError } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

/**
 * POST /api/notifications/register-token
 * Saves an Expo push token for the authenticated user/vendor.
 * Called on app startup after requesting notification permissions.
 *
 * Body: { token: string, platform: 'android' | 'ios' | 'web' }
 */
export async function POST(request: NextRequest) {
  try {
    const authToken =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json(apiError('Unauthorized'), { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(authToken, secret);
    const userId = payload.userId as string;
    const role = payload.role as string;

    const body = await request.json();
    const { token, platform } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(apiError('Push token is required'), { status: 400 });
    }

    if (!platform || !['android', 'ios', 'web'].includes(platform)) {
      return NextResponse.json(apiError('Valid platform (android/ios/web) is required'), { status: 400 });
    }

    await dbConnect();

    // Upsert: update if token exists, create if not
    await NotificationToken.findOneAndUpdate(
      { token },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(userId),
          userType: role === 'vendor' ? 'vendor' : 'user',
          platform,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      apiSuccess({}, 'Push token registered successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'JWTExpired') {
      return NextResponse.json(apiError('Token expired'), { status: 401 });
    }
    console.error('[RegisterToken] Error:', error);
    return NextResponse.json(apiError('Failed to register push token'), { status: 500 });
  }
}
