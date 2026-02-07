import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { status, rejectionReason } = body;

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status. Must be "approved" or "rejected"' },
                { status: 400 }
            );
        }

        if (status === 'rejected' && !rejectionReason) {
            return NextResponse.json(
                { success: false, error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            'kycDocuments.status': status,
            'kycDocuments.reviewedAt': new Date(),
        };

        if (status === 'rejected') {
            updateData['kycDocuments.rejectionReason'] = rejectionReason;
        } else {
            updateData['kycDocuments.rejectionReason'] = null;
        }

        const store = await Store.findByIdAndUpdate(id, updateData, { new: true });

        if (!store) {
            return NextResponse.json(
                { success: false, error: 'Store not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `KYC ${status} successfully`,
            data: { store }
        });
    } catch (error: any) {
        console.error('KYC update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update KYC status' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const store = await Store.findById(id)
            .select('shopName kycDocuments')
            .lean();

        if (!store) {
            return NextResponse.json(
                { success: false, error: 'Store not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { kycDocuments: store.kycDocuments }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
