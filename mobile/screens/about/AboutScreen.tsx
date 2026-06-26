import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function AboutScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Mission Section */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>Putting Savings Back in Your Pocket</Text>
                    <Text style={styles.heroSubtitle}>
                        offers buddy was created out of a simple frustration: it&apos;s too hard to find genuinely
                        good deals nearby. We realized that local businesses have great offers, but shoppers
                        waste time and fuel hunting for them.
                    </Text>
                </View>

                {/* Our Promise */}
                <View style={styles.cardsRow}>
                    <View style={styles.card}>
                        <View style={styles.iconCircle}>
                            <Feather name="eye" size={24} color="#FDB913" />
                        </View>
                        <Text style={styles.cardTitle}>Transparency</Text>
                        <Text style={styles.cardText}>
                            We provide direct links and clear photos. No bait-and-switch. You see exactly what&apos;s on offer.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.iconCircle}>
                            <Feather name="search" size={24} color="#FDB913" />
                        </View>
                        <Text style={styles.cardTitle}>Focus</Text>
                        <Text style={styles.cardText}>
                            We only show you deals relevant to your area, making every search efficient and meaningful.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.iconCircle}>
                            <Feather name="navigation" size={24} color="#FDB913" />
                        </View>
                        <Text style={styles.cardTitle}>Community</Text>
                        <Text style={styles.cardText}>
                            By connecting shoppers to local stores, we help both the consumer save money and the business gain customers.
                        </Text>
                    </View>
                </View>

                {/* Closing */}
                <View style={styles.closing}>
                    <Text style={styles.closingTitle}>We are offers buddy</Text>
                    <Text style={styles.closingText}>
                        And we&apos;re dedicated to helping you shop smarter, not harder.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { padding: 20, paddingBottom: 40 },
    hero: { alignItems: 'center', marginBottom: 32 },
    heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#282C3F', textAlign: 'center', marginBottom: 12 },
    heroSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
    cardsRow: { gap: 16, marginBottom: 32 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F', marginBottom: 8 },
    cardText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
    closing: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 28, alignItems: 'center' },
    closingTitle: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 8 },
    closingText: { fontSize: 16, color: '#555', textAlign: 'center' },
});
