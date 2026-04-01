import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Check Auth
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const role = searchParams.get('role');
        const query = searchParams.get('query');

        const skip = (page - 1) * limit;

        const filter: any = {};
        if (role) filter.role = role;
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(filter);

        return NextResponse.json(
            apiSuccess({
                users,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                },
            })
        );
    } catch (error: any) {
        return NextResponse.json(apiError(error.message || 'Failed to fetch users'), { status: 500 });
    }
}
