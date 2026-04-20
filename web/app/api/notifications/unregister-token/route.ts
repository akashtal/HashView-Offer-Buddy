import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import NotificationToken from '@/models/NotificationToken';
import { apiSuccess, apiError } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

/**
 * DELETE /api/notifications/unregister-token
 * Marks a push token as inactive (called on logout or when the user revokes permission).
 * Body: { token: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authToken =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json(apiError('Unauthorized'), { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(authToken, secret); // Just validate, no payload needed

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(apiError('Push token is required'), { status: 400 });
    }

    await dbConnect();
    await NotificationToken.findOneAndUpdate({ token }, { $set: { isActive: false } });

    return NextResponse.json(
      apiSuccess({}, 'Push token unregistered successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[UnregisterToken] Error:', error);
    return NextResponse.json(apiError('Failed to unregister push token'), { status: 500 });
  }
}
