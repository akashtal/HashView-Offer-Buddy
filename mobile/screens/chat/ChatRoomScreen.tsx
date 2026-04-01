import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

export default function ChatRoomScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated, isLoading } = useAuthStore();
    const { setActiveConversation } = useChatStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/(tabs)/signin');
        }
    }, [isAuthenticated, isLoading]);

    useEffect(() => {
        if (id) {
            setActiveConversation(id);
        }
        return () => {
            setActiveConversation(null);
        };
    }, [id]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.placeholder}>
                <Text style={styles.title}>Chat Room</Text>
                <Text style={styles.subText}>Conversation: {id}</Text>
                <Text style={styles.note}>Full chat UI will be rendered here after chat components are migrated.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 8 },
    subText: { fontSize: 14, color: '#888', marginBottom: 12 },
    note: { fontSize: 13, color: '#AAA', textAlign: 'center' },
});
