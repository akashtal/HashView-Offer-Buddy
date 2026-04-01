'use client';

import React, { useEffect } from 'react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import SwiggyHeader from '@/components/SwiggyHeader';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const router = useRouter();
    const { activeConversationId } = useChatStore();
    const { isLoading, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/signin?from=/chat');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Safe estimate for mobile header height (144px) and bottom nav (64px)
    // We use fixed positioning on mobile to ensure it doesn't scroll the body
    return (
        <div className="fixed top-[144px] bottom-[64px] left-0 right-0 md:static md:h-[calc(100dvh-85px)] bg-white flex flex-col overflow-hidden z-0">
            <main className="flex-1 flex overflow-hidden w-full max-w-full relative">
                {/* Inbox Sidebar - Hidden on mobile if a conversation is active */}
                <div className={`
                    ${activeConversationId ? 'hidden md:flex' : 'flex'} 
                    w-full md:w-1/3 md:min-w-[320px] md:max-w-sm flex-col border-r bg-white z-10
                `}>
                    <ChatList />
                </div>

                {/* Chat Window Area - Hidden on mobile if no conversation is active */}
                <div className={`
                    ${activeConversationId ? 'flex' : 'hidden md:flex'} 
                    flex-1 flex-col bg-gray-50 h-full w-full relative z-0
                `}>
                    <ChatWindow />
                </div>
            </main>
        </div>
    );
}
