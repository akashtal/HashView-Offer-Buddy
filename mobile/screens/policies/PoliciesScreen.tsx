import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PoliciesScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#282C3F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Legal & Policies</Text>
                <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Returns */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Return Policy</Text>
                    <Text style={styles.text}>
                        OffersBuddy does not provide or manage product returns. All purchases are made directly between the customer and the business. Any return requests must be discussed directly with the business from whom the product was purchased.
                    </Text>
                </View>

                {/* Refunds */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Refund Policy</Text>
                    <Text style={styles.text}>
                        OffersBuddy does not provide refunds for any products or services listed on the platform. Customers are responsible for verifying products before making payment. Any refund requests must be handled directly between the customer and the business.
                    </Text>
                </View>

                {/* Replacements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Replacement Policy</Text>
                    <Text style={styles.text}>
                        OffersBuddy does not offer replacements for products purchased from businesses listed on the platform. Any replacement requests are solely the responsibility of the business from which the product was purchased.
                    </Text>
                </View>

                {/* Privacy Policy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy Policy</Text>
                    <Text style={styles.text}>
                        OffersBuddy may collect information such as name, contact details, location information, device information, and app usage data to provide and improve services. User information may be used for customer support, security, fraud prevention, analytics, and service improvements. OffersBuddy takes reasonable measures to protect user data and does not sell personal information to third parties without consent, except where required by law.
                    </Text>
                </View>

                {/* Terms */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                    <Text style={styles.text}>1. Users must provide accurate information when using the app.</Text>
                    <Text style={styles.text}>2. Users agree to use the platform lawfully and responsibly.</Text>
                    <Text style={styles.text}>3. Businesses are solely responsible for the products, services, pricing, and information they provide.</Text>
                    <Text style={styles.text}>4. OffersBuddy is not a seller, supplier, manufacturer, or distributor of any products listed by businesses.</Text>
                    <Text style={styles.text}>5. OffersBuddy shall not be liable for disputes arising between customers and businesses.</Text>
                </View>

                {/* Account Deletion */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Deletion Policy</Text>
                    <Text style={styles.text}>
                        Users may delete their OffersBuddy account at any time through the app or by contacting support.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8, fontWeight: 'bold' }]}>Once an account is deleted:</Text>
                    <Text style={styles.text}>• Access to the account will be permanently removed.</Text>
                    <Text style={styles.text}>• Account information and related data will be deleted from active systems.</Text>
                    <Text style={styles.text}>• Deleted accounts cannot be recovered.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#EEE' },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F' },
    content: { padding: 20, paddingBottom: 60 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F', marginBottom: 8 },
    text: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 4 }
});
