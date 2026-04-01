import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <RNModal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.sheet]}>
                            {(title || showCloseButton) && (
                                <View style={styles.header}>
                                    {title && <Text style={styles.title}>{title}</Text>}
                                    {showCloseButton && (
                                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                            <Feather name="x" size={22} color="#555" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            <ScrollView contentContainerStyle={styles.body}>
                                {children}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sheet: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        width: '100%',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#EEE',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#282C3F', flex: 1 },
    closeBtn: { padding: 4, marginLeft: 10 },
    body: { padding: 20 },
});
