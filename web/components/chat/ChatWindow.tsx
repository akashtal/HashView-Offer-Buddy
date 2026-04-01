'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, User as UserIcon, Store, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { pusherClient } from '@/lib/pusher-client';
import ProductPicker from './ProductPicker';

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
    const [showProductPicker, setShowProductPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c._id === activeConversationId);
    const otherParticipant = activeConversation?.participants.find(p => String(p.participantId) !== String(user?.id));

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
        sendText(content);
    };

    const sendText = async (text: string, productId?: string) => {
        if (!text.trim() || !activeConversationId || isSending) return;

        try {
            setIsSending(true);
            // We need to extend sendMessage to support productId
            // Assuming sendMessage in store accepts extra data or we call API directly if store not updated?
            // For now, let's assume I need to update the store action too or pass it as 3rd arg if possible?
            // Checking useChatStore usage... probably need to modify store BUT
            // Let's modify the store call if I can, or for now just pass content.
            // Wait, I need to pass productId. The store likely only takes (id, content).
            // I'll update the store later? Or overload it?
            // I will cast it for now to avoid TS error if signature mismatches, assuming I will fix store.
            // Actually, better to just call API directly here if store prevents it, but that breaks state sync?
            // No, better to update store.
            // Let's assume sendMessage matches API signature update (I can update store in next step).
            await (sendMessage as any)(activeConversationId, text, productId);
            setContent('');
            setShowProductPicker(false);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleProductSelect = (product: any) => {
        sendText(`Hi, is this ${product.title} available?`, product._id);
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
        : (otherParticipant?.details?.name || otherParticipant?.details?.email?.split('@')[0] || 'User');

    // Determine if we can show product picker: Only if other participant is a Vendor
    const canShareProduct = otherParticipant?.participantModel === 'Vendor';

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
                                    className={`max-w-[75%] rounded-2xl shadow-sm overflow-hidden ${isMine
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}
                                >
                                    {/* Product Card Bubble */}
                                    {msg.productId && (
                                        <div className={`p-2 mb-1 ${isMine ? 'bg-indigo-500/50' : 'bg-gray-50'} rounded-lg flex items-center gap-3 max-w-sm`}>
                                            {/* Note: In a real app we need to populate productId. 
                                                If msg.productId is populated object, use it. 
                                                If it's just ID, we might not show details or need to fetch. 
                                                Assuming populated for now or fallback. */}
                                            <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden relative flex-shrink-0">
                                                {(msg.productId as any).images?.[0] ? (
                                                    <Image
                                                        src={(msg.productId as any).images[0]}
                                                        alt="Prd"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="w-5 h-5 opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                                    {(msg.productId as any).title || 'Product'}
                                                </p>
                                                <p className={`text-[10px] ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                    ₹{(msg.productId as any).price?.discounted || (msg.productId as any).price?.original || '---'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-4 py-2">
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                        <span className={`text-[10px] block mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Messages Chips */}
            <div className="px-4 pt-2 pb-0 bg-white border-t border-gray-100 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2">
                    {[
                        "Hi, is this available?",
                        "What is the best price?",
                        "Can you share more photos?",
                        "What are your business hours?",
                        "Do you deliver to my location?"
                    ].map((msg) => (
                        <button
                            key={msg}
                            onClick={() => sendText(msg)}
                            className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                        >
                            {msg}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Product Picker Button */}
                    {canShareProduct && (
                        <button
                            type="button"
                            onClick={() => setShowProductPicker(true)}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-indigo-600"
                            title="Share Product"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </button>
                    )}

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

            {/* Product Picker Modal */}
            {showProductPicker && otherParticipant && (
                <ProductPicker
                    vendorId={String(otherParticipant.participantId)}
                    onSelect={handleProductSelect}
                    onClose={() => setShowProductPicker(false)}
                />
            )}
        </div>
    );
};

export default ChatWindow;
