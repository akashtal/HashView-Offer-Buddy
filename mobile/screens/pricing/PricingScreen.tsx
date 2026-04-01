import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const plans = [
    {
        name: 'Starter',
        price: 'Free',
        desc: 'Perfect for small local shops just getting started.',
        features: ['List up to 5 products', 'Basic analytics', 'Standard support'],
        cta: 'Get Started',
        route: '/(auth)/signup',
        highlighted: false,
    },
    {
        name: 'Growth',
        price: '₹499',
        period: '/mo',
        desc: 'For growing businesses who need more visibility.',
        features: ['List up to 50 products', 'Advanced analytics', 'Featured placement', 'Priority support'],
        cta: 'Start Free Trial',
        route: '/(auth)/signup',
        highlighted: true,
    },
    {
        name: 'Business',
        price: '₹999',
        period: '/mo',
        desc: 'Maximum exposure for established brands.',
        features: ['Unlimited products', 'Premium analytics', 'Top search ranking', 'Dedicated manager'],
        cta: 'Contact Sales',
        route: '/(auth)/signup',
        highlighted: false,
    },
];

export default function PricingScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Simple, Transparent Pricing for Vendors</Text>
                    <Text style={styles.subtitle}>Start for free, upgrade as you grow. No hidden fees.</Text>
                </View>

                {plans.map((plan) => (
                    <View key={plan.name} style={[styles.card, plan.highlighted && styles.cardHighlighted]}>
                        {plan.highlighted && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>POPULAR</Text>
                            </View>
                        )}
                        <Text style={[styles.planName, plan.highlighted && styles.textWhite]}>{plan.name}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.planPrice}>{plan.price}</Text>
                            {plan.period && <Text style={[styles.planPeriod, plan.highlighted && styles.textWhite]}>{plan.period}</Text>}
                        </View>
                        <Text style={[styles.planDesc, plan.highlighted && styles.textWhite]}>{plan.desc}</Text>

                        {plan.features.map((f) => (
                            <View key={f} style={styles.featureRow}>
                                <Feather name="check" size={16} color={plan.highlighted ? '#FDB913' : '#4CAF50'} />
                                <Text style={[styles.featureText, plan.highlighted && styles.textWhite]}>{f}</Text>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.ctaBtn, plan.highlighted ? styles.ctaBtnYellow : styles.ctaBtnOutline]}
                            onPress={() => router.push(plan.route as any)}
                        >
                            <Text style={[styles.ctaBtnText, !plan.highlighted && styles.ctaBtnTextDark]}>{plan.cta}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 28 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#282C3F', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#666', textAlign: 'center' },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    cardHighlighted: { backgroundColor: '#282C3F' },
    popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FDB913', paddingHorizontal: 12, paddingVertical: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 8 },
    popularText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
    planName: { fontSize: 18, fontWeight: 'bold', color: '#282C3F', marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    planPrice: { fontSize: 32, fontWeight: 'bold', color: '#FDB913' },
    planPeriod: { fontSize: 14, color: '#999', marginLeft: 4 },
    planDesc: { color: '#666', marginBottom: 16, fontSize: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    featureText: { fontSize: 14, color: '#555' },
    textWhite: { color: '#FFF' },
    ctaBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
    ctaBtnYellow: { backgroundColor: '#FDB913' },
    ctaBtnOutline: { borderWidth: 2, borderColor: '#282C3F' },
    ctaBtnText: { fontWeight: 'bold', fontSize: 15, color: '#000' },
    ctaBtnTextDark: { color: '#282C3F' },
});
