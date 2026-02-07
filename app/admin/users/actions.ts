'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

/**
 * Server Action for updating user details
 * React 19.2 feature: Secure server-side user management
 */
export async function updateUserAction(id: string, formData: FormData) {
    try {
        await connectDB();

        const updates: any = {};

        if (formData.get('name')) updates.name = formData.get('name');
        if (formData.get('email')) updates.email = formData.get('email');
        if (formData.get('mobile')) updates.mobile = formData.get('mobile');
        if (formData.get('role')) updates.role = formData.get('role');

        const user = await User.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        revalidatePath('/admin/users');
        revalidatePath('/api/users');

        return { success: true, user: JSON.parse(JSON.stringify(user)) };
    } catch (error: any) {
        console.error('Update user error:', error);
        throw new Error(error.message || 'Failed to update user');
    }
}

/**
 * Server Action for deleting a user
 */
export async function deleteUserAction(id: string) {
    try {
        await connectDB();

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            throw new Error('User not found');
        }

        revalidatePath('/admin/users');

        return { success: true };
    } catch (error: any) {
        console.error('Delete user error:', error);
        throw new Error(error.message || 'Failed to delete user');
    }
}

/**
 * Server Action for resetting user password (admin only)
 */
export async function resetUserPasswordAction(id: string, newPassword: string) {
    try {
        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        revalidatePath('/admin/users');

        return { success: true };
    } catch (error: any) {
        console.error('Reset password error:', error);
        throw new Error(error.message || 'Failed to reset password');
    }
}

/**
 * Server Action for toggling user active status
 */
export async function toggleUserStatusAction(id: string) {
    try {
        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = !user.isActive;
        await user.save();

        revalidatePath('/admin/users');

        return { success: true, isActive: user.isActive };
    } catch (error: any) {
        console.error('Toggle user status error:', error);
        throw new Error(error.message || 'Failed to toggle user status');
    }
}
