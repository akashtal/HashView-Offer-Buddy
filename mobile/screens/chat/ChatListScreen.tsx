import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

// Design system components (will be converted to RN in components phase)
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatListScreen() {
    const router = useRouter();
    const { isLoading, isAuthenticated } = useAuthStore();
    const { activeConversationId } = useChatStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/(tabs)/signin');
        }
    }, [isAuthenticated, isLoading]);

    if (isLoading || !isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#FDB913" style={{ flex: 1, marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/*
              Mobile layout:
              - If no conversation is active: show ChatList (inbox)
              - If a conversation is active: show ChatWindow
              Navigation between the two is managed by useChatStore.activeConversationId
            */}
            <View style={styles.container}>
                {activeConversationId ? (
                    <ChatWindow />
                ) : (
                    <ChatList />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    container: { flex: 1 },
});
