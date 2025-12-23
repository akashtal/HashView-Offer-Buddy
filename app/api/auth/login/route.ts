import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return NextResponse.json(
        apiError('Invalid email or password'),
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        apiError('Your account has been deactivated. Please contact support.'),
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );
    
    if (!isPasswordValid) {
      return NextResponse.json(
        apiError('Invalid email or password'),
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const userData = {
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

    const response = NextResponse.json(
      apiSuccess({ user: userData, token }, 'Login successful'),
      { status: 200 }
    );

    // Set token in cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      apiError('Login failed. Please try again.'),
      { status: 500 }
    );
  }
}

