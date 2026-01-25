
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VendorAuth from '@/models/VendorAuth';
import { apiSuccess, apiError } from '@/lib/utils';
import { generateToken, comparePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                apiError('Email and password are required'),
                { status: 400 }
            );
        }

        // Find vendor by email (in VendorAuth table)
        const vendor = await VendorAuth.findOne({ email: email.toLowerCase() }).select('+password');

        if (!vendor) {
            return NextResponse.json(
                apiError('Invalid credentials'),
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await comparePassword(password, vendor.password!);

        if (!isMatch) {
            return NextResponse.json(
                apiError('Invalid credentials'),
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: vendor._id.toString(),
            email: vendor.email,
            role: 'vendor',
        });

        const response = NextResponse.json(
            apiSuccess({
                token,
                user: {
                    _id: vendor._id,
                    email: vendor.email,
                    role: 'vendor',
                },
            }),
            { status: 200 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Vendor login error:', error);
        return NextResponse.json(
            apiError('Login failed'),
            { status: 500 }
        );
    }
}
