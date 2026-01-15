'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

interface ChatButtonProps {
    recipientId: string;
    recipientModel: 'User' | 'Vendor';
    recipientName: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({
    recipientId,
    recipientModel,
    recipientName,
}) => {
    const router = useRouter();
    const { initiateChat, setActiveConversation } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();

    const handleChat = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push(`/signin?from=${window.location.pathname}`);
            return;
        }

        // Don't chat with yourself
        if (user?.id === recipientId) {
            return;
        }

        try {
            const conversationId = await initiateChat(recipientId, recipientModel);
            setActiveConversation(conversationId);
            router.push('/chat');
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    return (
        <button
            onClick={handleChat}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm"
        >
            <MessageCircle className="w-5 h-5" />
            <span>Chat with {recipientModel === 'Vendor' ? 'Vendor' : recipientName}</span>
        </button>
    );
};

export default ChatButton;
