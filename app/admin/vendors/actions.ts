'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import VendorAuth from '@/models/VendorAuth';
import Store from '@/models/Store';

/**
 * Server Action for approving a vendor
 * React 19.2: Secure vendor approval workflow
 */
export async function approveVendorAction(id: string) {
    try {
        await connectDB();

        const vendor = await VendorAuth.findById(id);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        vendor.status = 'approved';
        vendor.approvedAt = new Date();
        await vendor.save();

        revalidatePath('/admin/vendors');
        revalidatePath('/api/vendors');

        return { success: true, vendor: JSON.parse(JSON.stringify(vendor)) };
    } catch (error: any) {
        console.error('Approve vendor error:', error);
        throw new Error(error.message || 'Failed to approve vendor');
    }
}

/**
 * Server Action for rejecting a vendor
 */
export async function rejectVendorAction(id: string, reason?: string) {
    try {
        await connectDB();

        const vendor = await VendorAuth.findById(id);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        vendor.status = 'rejected';
        vendor.rejectionReason = reason;
        await vendor.save();

        revalidatePath('/admin/vendors');

        return { success: true };
    } catch (error: any) {
        console.error('Reject vendor error:', error);
        throw new Error(error.message || 'Failed to reject vendor');
    }
}

/**
 * Server Action for updating vendor details
 */
export async function updateVendorAction(id: string, formData: FormData) {
    try {
        await connectDB();

        const updates: any = {};

        if (formData.get('businessName')) updates.businessName = formData.get('businessName');
        if (formData.get('email')) updates.email = formData.get('email');
        if (formData.get('mobile')) updates.mobile = formData.get('mobile');
        if (formData.get('gstNumber')) updates.gstNumber = formData.get('gstNumber');

        const vendor = await VendorAuth.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!vendor) {
            throw new Error('Vendor not found');
        }

        revalidatePath('/admin/vendors');
        revalidatePath('/api/vendors');

        return { success: true, vendor: JSON.parse(JSON.stringify(vendor)) };
    } catch (error: any) {
        console.error('Update vendor error:', error);
        throw new Error(error.message || 'Failed to update vendor');
    }
}

/**
 * Server Action for toggling vendor active status
 */
export async function toggleVendorStatusAction(id: string) {
    try {
        await connectDB();

        const vendor = await VendorAuth.findById(id);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        vendor.isActive = !vendor.isActive;
        await vendor.save();

        // Also update associated store if exists
        if (vendor.storeId) {
            await Store.findByIdAndUpdate(vendor.storeId, {
                isActive: vendor.isActive
            });
        }

        revalidatePath('/admin/vendors');
        revalidatePath('/vendors');

        return { success: true, isActive: vendor.isActive };
    } catch (error: any) {
        console.error('Toggle vendor status error:', error);
        throw new Error(error.message || 'Failed to toggle vendor status');
    }
}
