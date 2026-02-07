'use server';

import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';

export async function getVendorsWithKYC(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
    await dbConnect();

    const query: any = {};

    if (filter === 'pending') {
        query['kycDocuments.status'] = 'pending';
    } else if (filter === 'approved') {
        query['kycDocuments.status'] = 'approved';
    } else if (filter === 'rejected') {
        query['kycDocuments.status'] = 'rejected';
    }

    const vendors = await Store.find(query)
        .populate('vendorId', 'name email phone')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(vendors));
}

export async function approveKYC(storeId: string) {
    await dbConnect();

    const store = await Store.findByIdAndUpdate(
        storeId,
        {
            'kycDocuments.status': 'approved',
            'kycDocuments.reviewedAt': new Date(),
            'kycDocuments.rejectionReason': null,
        },
        { new: true }
    );

    if (!store) {
        throw new Error('Store not found');
    }

    return { success: true };
}

export async function rejectKYC(storeId: string, reason: string) {
    await dbConnect();

    const store = await Store.findByIdAndUpdate(
        storeId,
        {
            'kycDocuments.status': 'rejected',
            'kycDocuments.reviewedAt': new Date(),
            'kycDocuments.rejectionReason': reason,
        },
        { new: true }
    );

    if (!store) {
        throw new Error('Store not found');
    }

    return { success: true };
}
