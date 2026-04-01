import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetOTPEmail } from '@/lib/mail';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(apiError('Please provide an email'), { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // For security reasons, don't reveal that the user doesn't exist
            return NextResponse.json(apiSuccess({}, 'If an account with that email exists, we have sent a reset link.'));
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(`Setting OTP ${otp} for user ${normalizedEmail}`);

        // Ensure the schema has the fields (Next.js hot reload safety)
        if (!User.schema.path('resetPasswordOTP')) {
            console.log('Force adding resetPasswordOTP to schema');
            User.schema.add({
                resetPasswordOTP: String,
                resetPasswordExpire: Date
            });
        }

        user.set('resetPasswordOTP', otp);
        user.set('resetPasswordExpire', new Date(Date.now() + 600000));

        const savedUser = await user.save();
        console.log('User saved successfully. Verify from saved doc:', {
            otp: savedUser.get('resetPasswordOTP'),
            expire: savedUser.get('resetPasswordExpire')
        });

        try {
            await sendPasswordResetOTPEmail(user.email, otp);
            return NextResponse.json(apiSuccess({}, 'OTP sent successfully to your email'));
        } catch (err) {
            console.error('Email send error:', err);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return NextResponse.json(apiError('Email could not be sent. Please check your SMTP settings.'), { status: 500 });
        }
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
