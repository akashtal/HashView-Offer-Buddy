'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { User, Store } from 'lucide-react';
import Image from 'next/image';
import { pusherClient } from '@/lib/pusher-client';

const ChatList: React.FC = () => {
    const {
        conversations,
        activeConversationId,
        setActiveConversation,
        fetchConversations,
        updateConversationLocally,
        isLoading
    } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = pusherClient.subscribe(`user-chats-${user.id}`);

        channel.bind('conversation-updated', (data: any) => {
            updateConversationLocally(data.conversationId, data.lastMessage);
        });

        return () => {
            pusherClient.unsubscribe(`user-chats-${user.id}`);
        };
    }, [user?.id, updateConversationLocally]);

    if (isLoading && conversations.length === 0) {
        return (
            <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <p className="text-lg font-medium">No conversations yet</p>
                <p className="text-sm">When you start chatting with vendors, they{"'"}ll show up here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto border-r bg-white">
            <div className="p-4 border-b bg-white sticky top-0 z-10 min-h-[73px] flex items-center">
                <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            </div>
            <div className="flex-1">
                {conversations.map((conv) => {
                    const otherParticipant = conv.participants.find(
                        (p) => String(p.participantId) !== String(user?.id)
                    );

                    if (!otherParticipant) return null;

                    const isVendor = otherParticipant.participantModel === 'Vendor';
                    const name = isVendor
                        ? otherParticipant.details?.shopName
                        : (otherParticipant.details?.name || otherParticipant.details?.email?.split('@')[0] || 'User');
                    const avatar = isVendor
                        ? otherParticipant.details?.logo
                        : otherParticipant.details?.avatar;

                    return (
                        <div
                            key={conv._id}
                            onClick={() => setActiveConversation(conv._id)}
                            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-indigo-50 border-b ${activeConversationId === conv._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'bg-white'
                                }`}
                        >
                            <div className="relative flex-shrink-0">
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt={name || 'Avatar'}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border">
                                        {isVendor ? <Store className="w-6 h-6 text-gray-500" /> : <User className="w-6 h-6 text-gray-500" />}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {name}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {conv.lastMessage?.content || 'Started a conversation'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
