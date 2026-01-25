'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

import { useToast } from '@/components/ui/Toast';

interface ChatButtonProps {
    recipientId: string;
    recipientModel: 'User' | 'Vendor';
    recipientName: string;
    className?: string;
    variant?: 'primary' | 'outline' | 'icon' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const ChatButton: React.FC<ChatButtonProps> = ({
    recipientId,
    recipientModel,
    recipientName,
    className = '',
    variant = 'primary',
    size = 'md'
}) => {
    const router = useRouter();
    const { initiateChat, setActiveConversation } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();
    const { showToast } = useToast();

    const handleChat = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            showToast('Please sign in to chat', 'info');
            router.push(`/signin?from=${window.location.pathname}`);
            return;
        }

        // Don't chat with yourself
        if (user?.id === recipientId) {
            showToast('You cannot chat with yourself', 'error');
            return;
        }

        try {
            const conversationId = await initiateChat(recipientId, recipientModel);
            setActiveConversation(conversationId);
            router.push('/chat');
        } catch (error: any) {
            console.error('Failed to start chat:', error);
            if (error.response?.status === 401) {
                showToast('Session expired, please sign in again', 'info');
                router.push(`/signin?from=${window.location.pathname}`);
            } else {
                showToast(error.response?.data?.error || 'Failed to start chat', 'error');
            }
        }
    };

    const baseStyles = "flex items-center justify-center gap-2 transition-colors duration-200 font-medium rounded-lg";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
        outline: "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
        ghost: "text-gray-600 hover:bg-gray-100",
        icon: "bg-white text-gray-700 hover:text-indigo-600 hover:bg-gray-50 border border-gray-200 shadow-sm rounded-full p-2"
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-6 py-3"
    };

    // Override size for icon variant
    const appliedSize = variant === 'icon' ? '' : sizes[size];

    return (
        <button
            onClick={handleChat}
            className={`${baseStyles} ${variants[variant]} ${appliedSize} ${className}`}
            title={`Chat with ${recipientName}`}
        >
            <MessageCircle className={`${variant === 'icon' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            {variant !== 'icon' && <span>Chat</span>}
        </button>
    );
};

export default ChatButton;
