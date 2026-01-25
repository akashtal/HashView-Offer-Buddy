
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VendorAuth from '@/models/VendorAuth';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';
import { generateToken, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    shopName: z.string().min(2),
    location: z.object({
        address: z.string(),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        pincode: z.string(),
        coordinates: z.tuple([z.number(), z.number()])
    }).optional(), // Make location optional for initial registration if needed, or required
    phone: z.string().min(10)
});

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();

        // Basic validation (can extend schema)
        const { email, password, shopName, phone } = body;

        if (!email || !password || !shopName || !phone) {
            return NextResponse.json(apiError('Missing required fields'), { status: 400 });
        }

        // Check if vendor already exists
        const existingVendor = await VendorAuth.findOne({ email: email.toLowerCase() });
        if (existingVendor) {
            return NextResponse.json(
                apiError('Vendor account already exists with this email'),
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create Vendor Auth
        const vendorAuth = await VendorAuth.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: false, // Default to false
            role: 'vendor'
        });

        // Create Store Profile is handled separately via /vendor/onboarding
        // This route only creates the VendorAuth account

        // Generate token
        const token = generateToken({
            userId: vendorAuth._id.toString(),
            email: vendorAuth.email,
            role: 'vendor',
        });

        const response = NextResponse.json(
            apiSuccess({
                token,
                user: {
                    _id: vendorAuth._id,
                    email: vendorAuth.email,
                    role: 'vendor',
                },
            }),
            { status: 201 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Vendor registration error:', error);
        return NextResponse.json(
            apiError('Registration failed'),
            { status: 500 }
        );
    }
}
