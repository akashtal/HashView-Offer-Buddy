import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, otp, password } = await request.json();

        if (!email || !otp || !password) {
            return NextResponse.json(apiError('Email, OTP and password are required'), { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedOTP = otp.toString().trim();

        console.log(`Reset attempt for ${normalizedEmail} with OTP: ${normalizedOTP}`);

        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordOTP: normalizedOTP,
            resetPasswordExpire: { $gt: new Date() },
        });

        if (!user) {
            console.log('User not found or OTP invalid/expired');
            // Check if user exists at all or if it's just OTP/Expire
            const potentialUser = await User.findOne({ email: normalizedEmail });
            if (!potentialUser) {
                console.log('No user found with this email');
            } else {
                console.log(`User found. DB OTP: ${potentialUser.resetPasswordOTP}, Expire: ${potentialUser.resetPasswordExpire}`);
            }
            return NextResponse.json(apiError('Invalid or expired OTP'), { status: 400 });
        }

        // Set new password
        user.password = await hashPassword(password);
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return NextResponse.json(apiSuccess({}, 'Password reset successful'));
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
