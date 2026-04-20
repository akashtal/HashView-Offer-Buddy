import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import Store from '@/models/Store';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import mongoose from 'mongoose';

// GET - Get unread message count for the current user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        // Build participant IDs (user + store for vendors)
        const participantIds: mongoose.Types.ObjectId[] = [];
        if (mongoose.Types.ObjectId.isValid(currentUser.userId)) {
            participantIds.push(new mongoose.Types.ObjectId(currentUser.userId));
        }

        if (currentUser.role === 'vendor') {
            const vendorStore = await Store.findOne({ vendorId: currentUser.userId }).select('_id').lean();
            if (vendorStore) {
                participantIds.push(vendorStore._id as mongoose.Types.ObjectId);
            }
        }

        // Get all conversations this user is part of
        const conversations = await Conversation.find({
            'participants.participantId': { $in: participantIds }
        }).select('_id').lean();

        const conversationIds = conversations.map((c) => c._id);

        // Count messages NOT sent by this user that are unread
        const unreadCount = await Message.countDocuments({
            conversationId: { $in: conversationIds },
            senderId: { $nin: participantIds },
            isRead: false,
        });

        return NextResponse.json(apiSuccess({ unreadCount }));
    } catch (error: any) {
        console.error('Unread count error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
