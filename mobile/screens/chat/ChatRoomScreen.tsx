import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Feather } from '@expo/vector-icons';
import { pusherClient } from '@/utils/pusher-client';

function formatMsgTime(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getParticipantInfo(conversation: any, currentUserId: string) {
    if (!conversation) return { name: 'Chat', avatar: null };
    const other = conversation.participants?.find(
        (p: any) => p.participantId !== currentUserId
    );
    if (!other) return { name: 'Chat', avatar: null };
    const d = other.details || {};
    return {
        name: d.shopName || d.name || 'Unknown',
        avatar: d.shopLogo || d.avatar || null,
    };
}

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
    return (
        <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
                    {message.content}
                </Text>
            </View>
            <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeRight : styles.bubbleTimeLeft]}>
                {formatMsgTime(message.createdAt)}
            </Text>
        </View>
    );
}

export default function ChatRoomScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
    const {
        conversations,
        messages,
        isLoading,
        setActiveConversation,
        sendMessage,
        addMessage,
        updateConversationLocally,
    } = useChatStore();

    const [inputText, setInputText] = React.useState('');
    const [sending, setSending] = React.useState(false);
    const flatListRef = useRef<FlatList>(null);

    const currentUserId = user?.id || '';
    const conversation = conversations.find((c) => c._id === id);
    const { name, avatar } = getParticipantInfo(conversation, currentUserId);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/(tabs)/signin');
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (id) {
            setActiveConversation(id);
        }
        return () => {
            setActiveConversation(null);
        };
    }, [id]);

    // Pusher real-time subscription
    useEffect(() => {
        if (!id || !pusherClient) return;
        const channel = pusherClient.subscribe(`chat-${id}`);
        channel.bind('new-message', (data: any) => {
            addMessage(data);
            updateConversationLocally(id, data);
        });
        return () => {
            pusherClient?.unsubscribe(`chat-${id}`);
        };
    }, [id]);


    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !id || sending) return;
        setInputText('');
        setSending(true);
        try {
            await sendMessage(id, text);
        } catch (e) {
            console.error('Send error:', e);
        } finally {
            setSending(false);
        }
    }, [inputText, id, sending, sendMessage]);

    if (authLoading || !isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#FDB913" style={{ flex: 1, marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color="#111827" />
                    </TouchableOpacity>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.headerAvatar} />
                    ) : (
                        <View style={styles.headerAvatarFallback}>
                            <Text style={styles.headerAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.headerSub}>Active</Text>
                    </View>
                </View>

                {/* Messages */}
                {isLoading && messages.length === 0 ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#FDB913" />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.centered}>
                        <Feather name="message-circle" size={56} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Say hello! Start the conversation.</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <MessageBubble
                                message={item}
                                isOwn={item.senderId === currentUserId}
                            />
                        )}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={1000}
                        returnKeyType="default"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                        activeOpacity={0.8}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Feather name="send" size={18} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backBtn: { padding: 6, marginRight: 10 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    headerAvatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDB913',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerAvatarInitial: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    headerSub: { fontSize: 12, color: '#10B981', fontWeight: '500' },

    // Messages List
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyText: { marginTop: 12, fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
    messagesList: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 4 },

    // Bubbles
    bubbleWrap: { marginVertical: 3 },
    bubbleWrapRight: { alignItems: 'flex-end' },
    bubbleWrapLeft: { alignItems: 'flex-start' },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 18,
    },
    bubbleOwn: {
        backgroundColor: '#FDB913',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextOwn: { color: '#111827' },
    bubbleTextOther: { color: '#374151' },
    bubbleTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginHorizontal: 4 },
    bubbleTimeRight: { textAlign: 'right' },
    bubbleTimeLeft: { textAlign: 'left' },

    // Input Bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 10,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
        lineHeight: 20,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FDB913',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});
