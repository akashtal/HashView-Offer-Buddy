import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';

// DELETE User
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        // Check Auth
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const user = await User.findByIdAndDelete(params.id);
        if (!user) {
            return NextResponse.json(apiError('User not found'), { status: 404 });
        }

        return NextResponse.json(apiSuccess(null, 'User deleted successfully'));
    } catch (error: any) {
        return NextResponse.json(apiError(error.message || 'Failed to delete user'), { status: 500 });
    }
}

// UPDATE User Role
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        // Check Auth
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const body = await request.json();
        const { role } = body;

        if (!role || !['user', 'vendor', 'admin'].includes(role)) {
            return NextResponse.json(apiError('Invalid role'), { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json(apiError('User not found'), { status: 404 });
        }

        return NextResponse.json(apiSuccess({ user }, 'User role updated successfully'));
    } catch (error: any) {
        return NextResponse.json(apiError(error.message || 'Failed to update user'), { status: 500 });
    }
}
