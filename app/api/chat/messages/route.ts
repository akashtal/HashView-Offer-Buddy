import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Store from '@/models/Store';
import { getUserFromRequest } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { apiSuccess, apiError } from '@/lib/utils';
import { sendEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const currentUser = await getUserFromRequest(request);

        if (!currentUser) {
            return NextResponse.json(apiError('Unauthorized'), { status: 401 });
        }

        const { conversationId, content, productId } = await request.json();

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
        const messageData: any = {
            conversationId,
            senderId: currentUser.userId,
            senderModel: currentUser.role === 'vendor' ? 'Vendor' : 'User',
            content,
        };

        if (productId) {
            messageData.productId = productId;
        }

        const message = await Message.create(messageData);

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
        // And Send Email to the RECIPIENT
        // Calculate recipient (the one who is NOT the current user)
        const recipient = conversation.participants.find(
            (p) => p.participantId.toString() !== currentUser.userId
        );

        if (recipient) {
            // Trigger Pusher for Inbox Update
            // We also trigger for sender above? No, loop below handles both.
            // Let's keep the loop for pusher as it was
        }

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

        // EMAIL NOTIFICATION LOGIC
        if (recipient) {
            try {
                let recipientEmail = '';
                let recipientName = 'User';

                if (recipient.participantModel === 'User') {
                    const userDoc = await User.findById(recipient.participantId);
                    if (userDoc) {
                        recipientEmail = userDoc.email;
                        recipientName = userDoc.name;
                    }
                } else if (recipient.participantModel === 'Vendor') {
                    const vendorDoc = await Store.findById(recipient.participantId).populate('vendorId');
                    if (vendorDoc) {
                        // Prefer the business email, fallback to account email
                        if (vendorDoc.contactInfo?.email) {
                            recipientEmail = vendorDoc.contactInfo.email;
                        } else if (vendorDoc.vendorId && (vendorDoc.vendorId as any).email) {
                            recipientEmail = (vendorDoc.vendorId as any).email;
                        }
                        recipientName = vendorDoc.shopName;
                    }
                }

                if (recipientEmail) {
                    console.log(`Sending email notification to ${recipientEmail}...`);
                    const senderName = currentUser.role === 'vendor' ? 'A Vendor' : currentUser.email.split('@')[0]; // Simple name logic

                    await sendEmail({
                        email: recipientEmail,
                        subject: `New Message from ${senderName} on Offer Buddy`,
                        message: `You have received a new message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                                <h3>New Message Received</h3>
                                <p><strong>${senderName}</strong> sent you a message:</p>
                                <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #0070f3;">
                                    ${content}
                                </blockquote>
                                <p style="margin-top: 20px;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                        Reply Now
                                    </a>
                                </p>
                            </div>
                        `
                    });
                    console.log('Email sent successfully');
                } else {
                    console.log('Recipient email not found, skipping notification.');
                }
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
                // Do not fail the request if email fails
            }
        }

        return NextResponse.json(apiSuccess(message));
    } catch (error: any) {
        console.error('Send message error:', error);
        return NextResponse.json(apiError('Internal server error'), { status: 500 });
    }
}
