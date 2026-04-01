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

        // Build participant IDs to match: always include userId, also include storeId for vendors
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

        // Single aggregation: fetch conversations + populate participant details in one shot
        const conversations = await Conversation.aggregate([
            {
                $match: {
                    'participants.participantId': { $in: participantIds }
                }
            },
            { $sort: { updatedAt: -1 } },
            // Populate lastMessage
            {
                $lookup: {
                    from: 'messages',
                    localField: 'lastMessage',
                    foreignField: '_id',
                    as: 'lastMessage'
                }
            },
            { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
            // Lookup User participants
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants.participantId',
                    foreignField: '_id',
                    as: '_userDetails',
                    pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }]
                }
            },
            // Lookup Store participants
            {
                $lookup: {
                    from: 'stores',
                    localField: 'participants.participantId',
                    foreignField: '_id',
                    as: '_storeDetails',
                    pipeline: [{ $project: { shopName: 1, email: 1, shopLogo: 1 } }]
                }
            },
            // Merge details back into participants array
            {
                $addFields: {
                    participants: {
                        $map: {
                            input: '$participants',
                            as: 'p',
                            in: {
                                $mergeObjects: [
                                    '$$p',
                                    {
                                        details: {
                                            $cond: [
                                                { $eq: ['$$p.participantModel', 'User'] },
                                                {
                                                    $first: {
                                                        $filter: {
                                                            input: '$_userDetails',
                                                            cond: { $eq: ['$$this._id', '$$p.participantId'] }
                                                        }
                                                    }
                                                },
                                                {
                                                    $first: {
                                                        $filter: {
                                                            input: '$_storeDetails',
                                                            cond: { $eq: ['$$this._id', '$$p.participantId'] }
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $project: { _userDetails: 0, _storeDetails: 0 } }
        ]);

        return NextResponse.json(apiSuccess(conversations));
    } catch (error: any) {
        console.error('Chat list error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
