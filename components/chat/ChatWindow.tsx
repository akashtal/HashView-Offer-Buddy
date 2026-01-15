'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, User as UserIcon, Store, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { pusherClient } from '@/lib/pusher-client';

const ChatWindow: React.FC = () => {
    const {
        activeConversationId,
        messages,
        conversations,
        sendMessage,
        addMessage,
        updateConversationLocally,
        setActiveConversation,
        isLoading
    } = useChatStore();
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c._id === activeConversationId);
    const otherParticipant = activeConversation?.participants.find(p => p.participantId !== user?.id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!activeConversationId) return;

        // Subscribe to Pusher channel for this conversation
        const channel = pusherClient.subscribe(`chat-${activeConversationId}`);

        channel.bind('new-message', (data: any) => {
            addMessage(data);
            updateConversationLocally(activeConversationId, data);
        });

        return () => {
            pusherClient.unsubscribe(`chat-${activeConversationId}`);
        };
    }, [activeConversationId, addMessage, updateConversationLocally]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !activeConversationId || isSending) return;

        try {
            setIsSending(true);
            await sendMessage(activeConversationId, content);
            setContent('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (!activeConversationId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-medium">Select a conversation</h2>
                <p className="text-sm">Choose a chat from the left to start messaging.</p>
            </div>
        );
    }

    const otherName = otherParticipant?.participantModel === 'Vendor'
        ? otherParticipant.details?.shopName
        : otherParticipant?.details?.name;

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b sticky top-0 bg-white z-10 min-h-[73px]">
                <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border">
                    {otherParticipant?.details?.logo || otherParticipant?.details?.avatar ? (
                        <Image
                            src={otherParticipant.details.logo || otherParticipant.details.avatar || ''}
                            alt={otherName || 'Avatar'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        otherParticipant?.participantModel === 'Vendor' ? <Store className="w-5 h-5 text-gray-500" /> : <UserIcon className="w-5 h-5 text-gray-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{otherName}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                            <div
                                key={msg._id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMine
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!content.trim() || isSending}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!content.trim() || isSending
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;
