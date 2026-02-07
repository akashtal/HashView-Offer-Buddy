import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import VendorAuth from '@/models/VendorAuth';
import { apiSuccess, apiError } from '@/lib/utils';

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

    await dbConnect();

    let userData;

    // Fetch user based on role
    if (role === 'vendor') {
      const vendor = await VendorAuth.findById(userId).select('-password');
      if (!vendor) {
        return NextResponse.json(
          apiError('Vendor not found'),
          { status: 404 }
        );
      }
      userData = {
        id: vendor._id,
        email: vendor.email,
        role: vendor.role,
        isVerified: vendor.isVerified,
      };
    } else {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return NextResponse.json(
          apiError('User not found'),
          { status: 404 }
        );
      }
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        location: user.location,
        preferences: user.preferences,
      };
    }

    return NextResponse.json(
      apiSuccess({ user: userData }, 'User data fetched successfully'),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get user error:', error);

    if (error.name === 'JWTExpired') {
      return NextResponse.json(
        apiError('Token expired'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      apiError('Failed to fetch user data'),
      { status: 500 }
    );
  }
}
