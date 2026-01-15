import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { recipientId, recipientModel } = await request.json();

        if (!recipientId || !recipientModel) {
            return NextResponse.json(apiError('Recipient information is required'), { status: 400 });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: {
                $all: [
                    { $elemMatch: { participantId: currentUser.userId } },
                    { $elemMatch: { participantId: recipientId } },
                ],
            },
        });

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [
                    {
                        participantId: currentUser.userId,
                        participantModel: currentUser.role === 'user' ? 'User' : (currentUser.role === 'vendor' ? 'Vendor' : 'User'), // Handle admin if needed
                    },
                    {
                        participantId: recipientId,
                        participantModel: recipientModel,
                    },
                ],
            });
        }

        return NextResponse.json(apiSuccess(conversation));
    } catch (error: any) {
        console.error('Chat conversation error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const conversations = await Conversation.find({
            'participants.participantId': currentUser.userId,
        })
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        // Manually populate participant details since refPath across models is tricky with populate
        const enhancedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const participants = await Promise.all(
                    conv.participants.map(async (p: any) => {
                        let details = null;
                        if (p.participantModel === 'User') {
                            details = await User.findById(p.participantId).select('name email avatar');
                        } else if (p.participantModel === 'Vendor') {
                            details = await Vendor.findById(p.participantId).select('shopName email logo');
                        }
                        return {
                            ...p.toObject(),
                            details,
                        };
                    })
                );

                return {
                    ...conv.toObject(),
                    participants,
                };
            })
        );

        return NextResponse.json(apiSuccess(enhancedConversations));
    } catch (error: any) {
        console.error('Chat list error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
