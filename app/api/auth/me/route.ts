import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

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

    // Update user
    const user = await User.findByIdAndUpdate(
      tokenData.userId,
      { $set: body },
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
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      apiError('Failed to update profile'),
      { status: 500 }
    );
  }
}

