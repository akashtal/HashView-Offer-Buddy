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

    // Normalize email for case-insensitive login
    const normalizedEmail = validatedData.email.toLowerCase().trim();

    // Find users (could be multiple if same email has different roles)
    const users = await User.find({ email: normalizedEmail });

    if (!users || users.length === 0) {
      return NextResponse.json(
        apiError('Invalid email or password'),
        { status: 401 }
      );
    }

    // Find the user with matching password
    let user = null;
    for (const u of users) {
      // Check if user is active
      if (!u.isActive) continue;

      const isPasswordValid = await comparePassword(
        validatedData.password,
        u.password
      );

      if (isPasswordValid) {
        user = u;
        break;
      }
    }

    if (!user) {
      // Check if any inactive user matched (for specific error) or just generic error
      const inactiveUser = users.find(u => !u.isActive);
      if (inactiveUser) {
        // Verify password for inactive user to give correct error
        const isPassValid = await comparePassword(validatedData.password, inactiveUser.password);
        if (isPassValid) {
          return NextResponse.json(
            apiError('Your account has been deactivated. Please contact support.'),
            { status: 403 }
          );
        }
      }

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

