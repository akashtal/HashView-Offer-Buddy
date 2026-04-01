import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

interface ChatButtonProps {
    recipientId: string;
    recipientModel: 'User' | 'Vendor';
    recipientName: string;
    variant?: 'primary' | 'outline' | 'icon' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const ChatButton: React.FC<ChatButtonProps> = ({
    recipientId,
    recipientModel,
    recipientName,
    variant = 'primary',
    size = 'md',
}) => {
    const router = useRouter();
    const { initiateChat, setActiveConversation } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();

    const handleChat = async () => {
        if (!isAuthenticated) {
            Alert.alert('Sign in Required', 'Please sign in to chat with vendors.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/(tabs)/signin') },
            ]);
            return;
        }

        if (user?.id === recipientId) {
            Alert.alert('Cannot chat with yourself');
            return;
        }

        if (user?.role === 'vendor') {
            router.push('/vendor/dashboard' as any);
            return;
        }

        try {
            const conversationId = await initiateChat(recipientId, recipientModel);
            setActiveConversation(conversationId);
            router.push('/chat' as any);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to start chat. Please try again.');
        }
    };

    const bgColor: Record<string, string> = {
        primary: '#4F46E5',
        outline: 'transparent',
        ghost: 'transparent',
        icon: '#FFF',
    };

    const textColor: Record<string, string> = {
        primary: '#FFF',
        outline: '#4F46E5',
        ghost: '#666',
        icon: '#555',
    };

    const iconSize = variant === 'icon' ? 20 : (size === 'sm' ? 14 : 16);

    return (
        <TouchableOpacity
            onPress={handleChat}
            activeOpacity={0.8}
            style={[
                styles.btn,
                { backgroundColor: bgColor[variant] },
                variant === 'outline' && styles.outline,
                variant === 'icon' && styles.iconVariant,
                variant === 'ghost' && styles.ghost,
                size === 'sm' && styles.sm,
                size === 'lg' && styles.lg,
            ]}
        >
            <Feather name="message-circle" size={iconSize} color={textColor[variant]} />
            {variant !== 'icon' && (
                <Text style={[styles.label, { color: textColor[variant], fontSize: size === 'sm' ? 12 : 14 }]}>
                    Chat
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
    outline: { borderWidth: 1.5, borderColor: '#4F46E5' },
    iconVariant: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0, borderWidth: 1, borderColor: '#DDD' },
    ghost: { paddingHorizontal: 8, paddingVertical: 6 },
    sm: { paddingHorizontal: 10, paddingVertical: 6 },
    lg: { paddingHorizontal: 20, paddingVertical: 12 },
    label: { fontWeight: '600' },
});

export default ChatButton;
