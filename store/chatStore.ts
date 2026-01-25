import { create } from 'zustand';
import axios from 'axios';
import { pusherClient } from '@/lib/pusher-client';
import { useAuthStore } from './authStore';

interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    senderModel: 'User' | 'Vendor';
    content: string;
    createdAt: string;
}

interface Participant {
    participantId: string;
    participantModel: 'User' | 'Vendor';
    details: {
        name?: string;
        shopName?: string;
        email: string;
        avatar?: string;
        logo?: string;
    };
}

interface Conversation {
    _id: string;
    participants: Participant[];
    lastMessage?: Message;
    lastMessageAt: string;
    updatedAt: string;
}

interface ChatState {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: Message[];
    isLoading: boolean;

    fetchConversations: () => Promise<void>;
    setActiveConversation: (conversationId: string | null) => void;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, content: string) => Promise<void>;
    addMessage: (message: Message) => void;
    updateConversationLocally: (conversationId: string, lastMessage: Message) => void;
    initiateChat: (recipientId: string, recipientModel: 'User' | 'Vendor') => Promise<string>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    activeConversationId: null,
    messages: [],
    isLoading: false,

    fetchConversations: async () => {
        try {
            set({ isLoading: true });
            const token = useAuthStore.getState().token;
            if (!token) return;

            const response = await axios.get('/api/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ conversations: response.data.data, isLoading: false });
        } catch (error) {
            console.error('Fetch conversations error:', error);
            set({ isLoading: false });
        }
    },

    setActiveConversation: (conversationId: string | null) => {
        set({ activeConversationId: conversationId });
        if (conversationId) {
            get().fetchMessages(conversationId);
        } else {
            set({ messages: [] });
        }
    },

    fetchMessages: async (conversationId: string) => {
        try {
            set({ isLoading: true });
            const token = useAuthStore.getState().token;
            if (!token) return;

            const response = await axios.get(`/api/chat/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ messages: response.data.data, isLoading: false });
        } catch (error) {
            console.error('Fetch messages error:', error);
            set({ isLoading: false });
        }
    },

    sendMessage: async (conversationId: string, content: string) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) return;

            await axios.post('/api/chat/messages',
                { conversationId, content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Send message error:', error);
        }
    },

    addMessage: (message: Message) => {
        const { activeConversationId, messages } = get();
        if (activeConversationId === message.conversationId) {
            set({ messages: [...messages, message] });
        }
    },

    updateConversationLocally: (conversationId: string, lastMessage: Message) => {
        const { conversations } = get();
        const updatedConversations = conversations.map((conv) => {
            if (conv._id === conversationId) {
                return {
                    ...conv,
                    lastMessage,
                    lastMessageAt: lastMessage.createdAt,
                    updatedAt: lastMessage.createdAt,
                };
            }
            return conv;
        });

        // Sort by updated time
        updatedConversations.sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );

        set({ conversations: updatedConversations });
    },

    initiateChat: async (recipientId: string, recipientModel: 'User' | 'Vendor') => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post('/api/chat/conversations',
                { recipientId, recipientModel },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const conversation = response.data.data;

            // Refresh list to include new conversation if not already there
            await get().fetchConversations();

            return conversation._id;
        } catch (error) {
            console.error('Initiate chat error:', error);
            throw error;
        }
    },
}));
