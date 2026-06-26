import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

import { Image } from 'expo-image';
interface ChatListProps {
    scrollEnabled?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ scrollEnabled = true }) => {
    const router = useRouter();
    const {
        conversations,
        activeConversationId,
        setActiveConversation,
        fetchConversations,
        isLoading,
    } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    if (isLoading && conversations.length === 0) {
        return (
            <View style={styles.skeletons}>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeleton} />
                ))}
            </View>
        );
    }

    if (conversations.length === 0) {
        return (
            <View style={styles.empty}>
                <Feather name="message-square" size={48} color="#CCC" />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptyText}>When you start chatting with vendors, they&apos;ll show up here.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>
            <FlashList
                scrollEnabled={scrollEnabled}
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={({ item: conv }) => {
                    const other = conv.participants.find(
                        (p: any) => String(p.participantId) !== String(user?.id)
                    );
                    if (!other) return null;

                    const isVendor = other.participantModel === 'Vendor';
                    const name = isVendor
                        ? other.details?.shopName
                        : (other.details?.name || other.details?.email?.split('@')[0] || 'User');
                    const avatar = isVendor ? other.details?.logo : other.details?.avatar;
                    const isActive = activeConversationId === conv._id;

                    return (
                        <TouchableOpacity
                            key={conv._id}
                            style={[styles.item, isActive && styles.itemActive]}
                            onPress={() => {
                                setActiveConversation(conv._id);
                                router.push(`/chat/${conv._id}` as any);
                            }}
                        >
                            <View style={styles.avatar}>
                                {avatar ? (
                                    <Image source={{ uri: avatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarFallback}>
                                        <Feather name={isVendor ? 'shopping-bag' : 'user'} size={22} color="#888" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.itemContent}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                                    <Text style={styles.time}>
                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                    </Text>
                                </View>
                                <Text style={styles.lastMsg} numberOfLines={1}>
                                    {conv.lastMessage?.content || 'Started a conversation'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#EEE' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#282C3F' },
    skeletons: { padding: 16, gap: 12 },
    skeleton: { height: 72, backgroundColor: '#F0F0F0', borderRadius: 10 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 14, marginBottom: 6 },
    emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F5F5F5' },
    itemActive: { backgroundColor: '#EEF2FF', borderLeftWidth: 3, borderLeftColor: '#4F46E5' },
    avatar: { flexShrink: 0 },
    avatarImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#EEE' },
    avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    itemContent: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
    name: { fontSize: 14, fontWeight: '600', color: '#282C3F', flex: 1, marginRight: 8 },
    time: { fontSize: 11, color: '#888' },
    lastMsg: { fontSize: 13, color: '#888' },
});

export default ChatList;
