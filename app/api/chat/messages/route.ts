import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { conversationId, content } = await request.json();

        if (!conversationId || !content) {
            return NextResponse.json(apiError('Conversation ID and content are required'), { status: 400 });
        }

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

        // Create message
        const message = await Message.create({
            conversationId,
            senderId: currentUser.userId,
            senderModel: currentUser.role === 'vendor' ? 'Vendor' : 'User',
            content,
        });

        // Update conversation last message
        conversation.lastMessage = message._id as any;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Trigger Pusher event
        await pusherServer.trigger(
            `chat-${conversationId}`,
            'new-message',
            message
        );

        // Also trigger update for conversation list (inbox) for both participants
        for (const participant of conversation.participants) {
            await pusherServer.trigger(
                `user-chats-${participant.participantId}`,
                'conversation-updated',
                {
                    conversationId,
                    lastMessage: message,
                }
            );
        }

        return NextResponse.json(apiSuccess(message));
    } catch (error: any) {
        console.error('Send message error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
