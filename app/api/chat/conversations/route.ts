import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Store from '@/models/Store';
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

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(currentUser.userId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return NextResponse.json(apiError('Invalid user or recipient ID'), { status: 400 });
        }

        const userObjectId = new mongoose.Types.ObjectId(currentUser.userId);
        const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: {
                $all: [
                    { $elemMatch: { participantId: userObjectId } },
                    { $elemMatch: { participantId: recipientObjectId } },
                ],
            },
        });

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [
                    {
                        participantId: userObjectId,
                        participantModel: currentUser.role === 'user' ? 'User' : (currentUser.role === 'vendor' ? 'Store' : 'User'), // Handle admin if needed
                    },
                    {
                        participantId: recipientObjectId,
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

        let participantQuery: any[] = [{ 'participants.participantId': currentUser.userId }];

        if (currentUser.role === 'vendor') {
            const vendorStore = await Store.findOne({ vendorId: currentUser.userId });
            if (vendorStore) {
                participantQuery.push({ 'participants.participantId': vendorStore._id });
            }
        }

        const conversations = await Conversation.find({
            $or: participantQuery
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
                        } else if (p.participantModel === 'Vendor' || p.participantModel === 'Store') {
                            details = await Store.findById(p.participantId).select('shopName email logo');
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
