import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

import { Image } from 'expo-image';
export default function ChatWindow() {
    const router = useRouter();
    const { activeConversationId, messages, conversations, sendMessage, setActiveConversation, isLoading } = useChatStore();
    const { user } = useAuthStore();
    
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlashListRef<any>>(null);

    const activeConversation = conversations.find(c => c._id === activeConversationId);
    const otherParticipant = activeConversation?.participants.find((p: any) => String(p.participantId) !== String(user?.id));

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!content.trim() || !activeConversationId || isSending) return;

        try {
            setIsSending(true);
            await sendMessage(activeConversationId, content.trim());
            setContent('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendSuggested = (text: string) => {
        setContent(text);
        // We could send immediately, but let's just populate input for them to review
    };

    if (!activeConversationId) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                    <Feather name="message-square" size={32} color="#CCC" />
                </View>
                <Text style={styles.emptyTitle}>Select a conversation</Text>
                <Text style={styles.emptySub}>Choose a chat from the list to start messaging.</Text>
            </View>
        );
    }

    const otherName = otherParticipant?.participantModel === 'Vendor'
        ? otherParticipant.details?.shopName
        : (otherParticipant?.details?.name || otherParticipant?.details?.email?.split('@')[0] || 'User');
    
    const isVendor = otherParticipant?.participantModel === 'Vendor';
    const avatar = otherParticipant?.details?.logo || otherParticipant?.details?.avatar;

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setActiveConversation(null)} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#555" />
                </TouchableOpacity>
                
                <View style={styles.avatarWrap}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Feather name={isVendor ? 'shopping-bag' : 'user'} size={20} color="#888" />
                        </View>
                    )}
                </View>
                
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>
            </View>

            {/* Messages */}
            {isLoading && messages.length === 0 ? (
                <View style={[styles.messagesArea, styles.centerAll]}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlashList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    renderItem={({ item: msg }) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                            <View style={[styles.messageRow, isMine ? styles.messageMine : styles.messageTheirs]}>
                                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                                    
                                    {/* Product Reference (if any) */}
                                    {msg.productId && (
                                        <View style={[styles.productRef, isMine ? styles.productRefMine : styles.productRefTheirs]}>
                                            <View style={styles.productImgWrap}>
                                                {(msg.productId as any).images?.[0] ? (
                                                    <Image source={{ uri: (msg.productId as any).images[0] }} style={styles.productImg} />
                                                ) : (
                                                    <Feather name="package" size={20} color="#888" />
                                                )}
                                            </View>
                                            <View style={styles.productInfo}>
                                                <Text style={[styles.productTitle, isMine ? { color: '#FFF' } : { color: '#000' }]} numberOfLines={1}>
                                                    {(msg.productId as any).title || 'Product'}
                                                </Text>
                                                <Text style={[styles.productPrice, isMine ? { color: 'rgba(255,255,255,0.8)' } : { color: '#666' }]}>
                                                    ₹{(msg.productId as any).price?.discounted || (msg.productId as any).price?.original || '---'}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextTheirs]}>
                                        {msg.content}
                                    </Text>
                                    <Text style={[styles.msgTime, isMine ? styles.msgTimeMine : styles.msgTimeTheirs]}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            {/* Suggested Chips */}
            <View style={styles.suggestionsWrapper}>
                <FlashList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={["Hi, is this available?", "What is the best price?", "Can you share more photos?", "Do you deliver?"]}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.suggestionsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.suggestionChip} onPress={() => handleSendSuggested(item)}>
                            <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                    />
                </View>
                <TouchableOpacity 
                    style={[styles.sendBtn, (!content.trim() || isSending) && styles.sendBtnDisabled]} 
                    onPress={handleSend}
                    disabled={!content.trim() || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Feather name="send" size={18} color={!content.trim() ? '#999' : '#FFF'} style={{ marginLeft: -2 }} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    emptyContainer: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
    emptyIconWrap: { width: 64, height: 64, backgroundColor: '#EEE', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#555' },
    emptySub: { fontSize: 13, color: '#888', marginTop: 6 },
    
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    centerAll: { justifyContent: 'center', alignItems: 'center' },
    
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#EEE', zIndex: 10 },
    backBtn: { padding: 4, marginRight: 8, display: 'flex' }, // visible on mobile to go back to list
    avatarWrap: { marginRight: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: 'bold', color: '#282C3F' },
    headerStatus: { fontSize: 12, color: '#2E7D32', fontWeight: '500', marginTop: 2 },
    
    messagesArea: { flex: 1 },
    messagesList: { padding: 16, gap: 12, paddingBottom: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 12 },
    messageMine: { justifyContent: 'flex-end' },
    messageTheirs: { justifyContent: 'flex-start' },
    
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    bubbleMine: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F0F0F0' },
    
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextMine: { color: '#FFF' },
    msgTextTheirs: { color: '#333' },
    
    msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
    msgTimeTheirs: { color: '#999' },
    
    productRef: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, marginBottom: 8 },
    productRefMine: { backgroundColor: 'rgba(255,255,255,0.15)' },
    productRefTheirs: { backgroundColor: '#F5F5F5' },
    productImgWrap: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#E0E0E0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    productImg: { width: '100%', height: '100%' },
    productInfo: { flex: 1 },
    productTitle: { fontSize: 13, fontWeight: '600' },
    productPrice: { fontSize: 11, marginTop: 2 },
    
    suggestionsWrapper: { backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
    suggestionsList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    suggestionChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E0E7FF' },
    suggestionText: { color: '#4F46E5', fontSize: 13, fontWeight: '500' },
    
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
    inputWrapper: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, minHeight: 44, maxHeight: 100, paddingHorizontal: 16, justifyContent: 'center', marginRight: 10 },
    input: { fontSize: 15, color: '#333', paddingVertical: 10 },
    
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: '#F0F0F0' },
});
