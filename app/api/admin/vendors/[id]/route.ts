import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { updateVendorSchema } from '@/lib/validation';

// PUT - Update Vendor (Edit)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const admin = await getUserFromRequest(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const body = await request.json();
        // Use partial schema for updates
        const validatedData = updateVendorSchema.parse(body);

        const vendor = await Vendor.findByIdAndUpdate(
            params.id,
            { $set: validatedData },
            { new: true, runValidators: true }
        );

        if (!vendor) return NextResponse.json(apiError('Vendor not found'), { status: 404 });

        return NextResponse.json(apiSuccess({ vendor }, 'Vendor updated successfully'));
    } catch (error: any) {
        if (error.name === 'ZodError') return NextResponse.json(apiError(error.errors[0].message), { status: 400 });
        return NextResponse.json(apiError(error.message), { status: 500 });
    }
}

// DELETE - Hard Delete Vendor
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const admin = await getUserFromRequest(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const vendor = await Vendor.findByIdAndDelete(params.id);
        if (!vendor) return NextResponse.json(apiError('Vendor not found'), { status: 404 });

        // Also delete associated products
        await Product.deleteMany({ vendorId: params.id });

        return NextResponse.json(apiSuccess(null, 'Vendor and products permanently deleted'));
    } catch (error: any) {
        return NextResponse.json(apiError(error.message), { status: 500 });
    }
}

// PATCH - Toggle Status (Suspend/Activate)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const admin = await getUserFromRequest(request);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const body = await request.json();
        const { isActive, isApproved } = body;

        const update: any = {};
        if (typeof isActive === 'boolean') update.isActive = isActive;
        if (typeof isApproved === 'boolean') update.isApproved = isApproved;

        const vendor = await Vendor.findByIdAndUpdate(
            params.id,
            { $set: update },
            { new: true }
        );

        if (!vendor) return NextResponse.json(apiError('Vendor not found'), { status: 404 });

        // If suspending, also suspend products
        if (isActive === false) {
            await Product.updateMany({ vendorId: params.id }, { isActive: false });
        }
        // If activating, we might want to activate products too? 
        // Usually better to leave products as they were or activate them if they were auto-suspended. 
        // For now let's just re-enable the vendor. Products might need manual activation or assume they follow vendor.
        // Let's reactivate products if vendor is reactivated, to be helpful.
        if (isActive === true) {
            await Product.updateMany({ vendorId: params.id }, { isActive: true });
        }

        return NextResponse.json(apiSuccess({ vendor }, 'Vendor status updated'));
    } catch (error: any) {
        return NextResponse.json(apiError(error.message), { status: 500 });
    }
}
