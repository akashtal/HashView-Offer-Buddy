import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { updateUserSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get user from token
    const tokenData = await getUserFromRequest(request);

    if (!tokenData) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findById(tokenData.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        apiError('User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      apiSuccess({ user }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      apiError('Failed to get user data'),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // Get user from token
    const tokenData = await getUserFromRequest(request);

    if (!tokenData) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate
    const validatedData = updateUserSchema.parse(body);

    // Update user
    const user = await User.findByIdAndUpdate(
      tokenData.userId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        apiError('User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      apiSuccess({ user }, 'Profile updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }
    return NextResponse.json(
      apiError('Failed to update profile'),
      { status: 500 }
    );
  }
}

