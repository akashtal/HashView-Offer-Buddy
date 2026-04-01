'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import VendorAuth from '@/models/VendorAuth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

// Validation schemas
const signInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'vendor', 'admin']).optional(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
    token: z.string().optional(),
    email: z.string().email().optional(),
    otp: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function signInAction(formData: FormData) {
    try {
        await dbConnect();

        const rawData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            role: (formData.get('role') as string) || 'user',
        };

        const validated = signInSchema.parse(rawData);
        const { email, password, role } = validated;

        let user;
        let userRole = role;

        if (role === 'vendor') {
            user = await VendorAuth.findOne({ email });
            if (!user) {
                return { success: false, error: 'Invalid credentials' };
            }
            userRole = 'vendor';
        } else {
            user = await User.findOne({ email });
            if (!user) {
                return { success: false, error: 'Invalid credentials' };
            }
            userRole = user.role;
        }

        // Ensure password exists on user object
        if (!user.password) {
            return { success: false, error: 'Invalid credentials' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: userRole },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return {
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: userRole === 'vendor'
                        ? ('businessName' in user ? user.businessName : undefined)
                        : ('name' in user ? user.name : undefined),
                    role: userRole,
                },
                token,
            },
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Sign in error:', error);
        return { success: false, error: 'Authentication failed' };
    }
}

export async function forgotPasswordAction(formData: FormData) {
    try {
        await dbConnect();

        const rawData = {
            email: formData.get('email') as string,
        };

        const validated = forgotPasswordSchema.parse(rawData);
        const { email } = validated;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return {
                success: true,
                message: 'If an account exists with this email, you will receive a password reset OTP.',
            };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user
        user.resetPasswordOTP = otp;
        user.resetPasswordExpire = otpExpiry;
        await user.save();

        // TODO: Send OTP via email (integrate with email service)
        console.log(`Password reset OTP for ${email}: ${otp}`);

        return {
            success: true,
            message: 'Password reset OTP sent to your email',
            // In development, return OTP for testing
            ...(process.env.NODE_ENV === 'development' && { otp }),
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Forgot password error:', error);
        return { success: false, error: 'Failed to process request' };
    }
}

export async function resetPasswordAction(formData: FormData) {
    try {
        await dbConnect();

        const rawData = {
            token: formData.get('token') as string,
            email: formData.get('email') as string,
            otp: formData.get('otp') as string,
            password: formData.get('password') as string,
        };

        const validated = resetPasswordSchema.parse(rawData);
        const { token, email, otp, password } = validated;

        let user;

        // Support both token-based and OTP-based reset
        if (token) {
            // Token-based reset (from email link)
            user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpire: { $gt: Date.now() },
            });
        } else if (email && otp) {
            // OTP-based reset
            user = await User.findOne({
                email,
                resetPasswordOTP: otp,
                resetPasswordExpire: { $gt: Date.now() },
            });
        }

        if (!user) {
            return { success: false, error: 'Invalid or expired reset token/OTP' };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return {
            success: true,
            message: 'Password reset successful',
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error('Reset password error:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}

export async function signOutAction() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('token');

        return { success: true, message: 'Signed out successfully' };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: 'Failed to sign out' };
    }
}
