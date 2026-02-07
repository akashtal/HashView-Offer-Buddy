import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ conversationId: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { conversationId } = params;

        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return NextResponse.json(apiError('Conversation not found'), { status: 404 });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.participantId.toString() === currentUser.userId
        );

        if (!isParticipant) {
            return NextResponse.json(apiError('Forbidden'), { status: 403 });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .limit(100); // Pagination could be added later

        return NextResponse.json(apiSuccess(messages));
    } catch (error: any) {
        console.error('Fetch messages error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
