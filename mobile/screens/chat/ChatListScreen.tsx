import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Feather } from '@expo/vector-icons';

import { Image } from 'expo-image';
function formatTime(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function getParticipantInfo(conversation: any, currentUserId: string) {
    const other = conversation.participants?.find(
        (p: any) => p.participantId !== currentUserId
    );
    if (!other) return { name: 'Unknown', avatar: null };
    const d = other.details || {};
    return {
        name: d.shopName || d.name || 'Unknown',
        avatar: d.shopLogo || d.avatar || null,
    };
}

function ConversationItem({ item, currentUserId, onPress }: any) {
    const { name, avatar } = getParticipantInfo(item, currentUserId);
    const lastMsg = item.lastMessage?.content || 'No messages yet';
    const time = formatTime(item.lastMessageAt || item.updatedAt);
    const initials = name.charAt(0).toUpperCase();

    return (
        <TouchableOpacity style={styles.convRow} onPress={() => onPress(item._id)} activeOpacity={0.75}>
            <View style={styles.avatarWrap}>
                {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}
            </View>
            <View style={styles.convContent}>
                <View style={styles.convTopRow}>
                    <Text style={styles.convName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.convTime}>{time}</Text>
                </View>
                <Text style={styles.convPreview} numberOfLines={1}>{lastMsg}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function ChatListScreen() {
    const router = useRouter();
    const { isLoading: authLoading, isAuthenticated, user } = useAuthStore();
    const { conversations, isLoading, fetchConversations, fetchUnreadCount } = useChatStore();
    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/(tabs)/signin');
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
            fetchUnreadCount();
        }
    }, [isAuthenticated]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchConversations();
        setRefreshing(false);
    }, []);

    const handleConversationPress = (convId: string) => {
        router.push(`/(tabs)/chat/${convId}` as any);
    };

    if (authLoading || !isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#FDB913" style={{ flex: 1, marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Header Bar */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Feather name="edit" size={22} color="#333" />
            </View>

            {isLoading && conversations.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FDB913" />
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.centered}>
                    <Feather name="message-circle" size={64} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                    <Text style={styles.emptySubtitle}>Start chatting with a vendor from a product page</Text>
                </View>
            ) : (
                <FlashList
                    data={conversations}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <ConversationItem
                            item={item}
                            currentUserId={user?.id || ''}
                            onPress={handleConversationPress}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FDB913']} tintColor="#FDB913" />
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
    convRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFF',
    },
    avatarWrap: { marginRight: 14 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FDB913',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    convContent: { flex: 1 },
    convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    convName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
    convTime: { fontSize: 12, color: '#9CA3AF' },
    convPreview: { fontSize: 14, color: '#6B7280', lineHeight: 18 },
    separator: { height: 1, backgroundColor: '#F9FAFB', marginLeft: 86 },
});
