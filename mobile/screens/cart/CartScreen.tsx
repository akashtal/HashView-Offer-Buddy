import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';

// Design system components (will be converted to RN in components phase)
import ChatButton from '@/components/chat/ChatButton';

export default function CartScreen() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, clearCart, getTotal, syncCart } = useCartStore();

    useEffect(() => {
        syncCart();
    }, []);

    const handleRemove = (productId: string) => {
        removeItem(productId);
    };

    const handleClearCart = () => {
        Alert.alert('Clear Cart', 'Remove all items from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
        ]);
    };

    const subtotal = getTotal();

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.emptyContainer}>
                    <Feather name="shopping-bag" size={64} color="#CCC" />
                    <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                    <Text style={styles.emptyText}>Add some products to get started!</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/products')}>
                        <Text style={styles.browseBtnText}>Browse Products</Text>
                        <Feather name="arrow-right" size={16} color="#000" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Interested Products</Text>
                <TouchableOpacity onPress={handleClearCart}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Cart Items */}
                {items.map((item) => (
                    <View key={item.productId} style={styles.itemCard}>
                        <TouchableOpacity onPress={() => router.push(`/products/${item.productId}`)}>
                            <Image
                                source={{ uri: item.image || 'https://via.placeholder.com/96' }}
                                style={styles.itemImage}
                            />
                        </TouchableOpacity>

                        <View style={styles.itemInfo}>
                            <TouchableOpacity onPress={() => router.push(`/products/${item.productId}`)}>
                                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                            </TouchableOpacity>
                            <Text style={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                            <Text style={styles.itemQty}>Quantity: {item.quantity}</Text>

                            {/* ChatButton component — opens chat with vendor */}
                            {item.vendorId && (
                                <ChatButton
                                    recipientId={item.vendorId}
                                    recipientModel="Vendor"
                                    recipientName="Vendor"
                                    variant="ghost"
                                />
                            )}
                        </View>

                        <View style={styles.itemActions}>
                            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.productId)}>
                                <Feather name="trash-2" size={18} color="#E53935" />
                            </TouchableOpacity>
                            <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                ))}

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Products</Text>
                        <Text style={styles.summaryValue}>{items.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Items</Text>
                        <Text style={styles.summaryValue}>{items.reduce((s, i) => s + i.quantity, 0)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Estimated Value</Text>
                        <Text style={styles.totalValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.noteBox}>
                        <Feather name="info" size={14} color="#856404" />
                        <Text style={styles.noteText}>Contact vendors directly to get the best price and quotations for your requirements.</Text>
                    </View>

                    <TouchableOpacity style={styles.continueBrowsing} onPress={() => router.push('/products')}>
                        <Text style={styles.continueBrowsingText}>Continue Browsing</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F3F3' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F' },
    clearText: { fontSize: 14, color: '#E53935', fontWeight: '600' },
    container: { padding: 16, paddingBottom: 40 },
    itemCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, flexDirection: 'row', marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
    itemImage: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#F5F5F5', marginRight: 12 },
    itemInfo: { flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: '600', color: '#282C3F', marginBottom: 6 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#FDB913', marginBottom: 4 },
    itemQty: { fontSize: 13, color: '#888' },
    itemActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
    removeBtn: { padding: 4 },
    itemTotal: { fontSize: 14, fontWeight: '600', color: '#282C3F' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#555', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#888', fontSize: 14, marginBottom: 24 },
    browseBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#FDB913', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    browseBtnText: { fontWeight: 'bold', color: '#000' },
    summaryCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE', marginTop: 8 },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F', marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: '#666', fontSize: 14 },
    summaryValue: { fontWeight: '600', color: '#282C3F', fontSize: 14 },
    totalRow: { borderTopWidth: 1, borderColor: '#EEE', paddingTop: 12, marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#282C3F' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#FDB913' },
    noteBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF8E1', borderRadius: 8, padding: 12, marginTop: 14, alignItems: 'flex-start' },
    noteText: { flex: 1, fontSize: 12, color: '#856404', lineHeight: 18 },
    continueBrowsing: { backgroundColor: '#FDB913', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
    continueBrowsingText: { fontWeight: 'bold', fontSize: 15, color: '#000' },
});
