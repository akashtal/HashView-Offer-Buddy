import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ContactScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSend = () => {
        // Will be wired to API in Phase 3
        console.log({ firstName, lastName, email, message });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Get in Touch</Text>
                <Text style={styles.subtitle}>
                    Have a question or spotted a super deal we missed? Tell us about it!
                </Text>

                {/* Contact Info */}
                <View style={styles.infoSection}>
                    <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL('mailto:support@offerbuddy.com')}>
                        <View style={styles.iconCircle}><Feather name="mail" size={20} color="#FDB913" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Email Us</Text>
                            <Text style={styles.infoText}>support@offerbuddy.com</Text>
                            <Text style={styles.infoText}>partners@offerbuddy.com</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL('tel:+911234567890')}>
                        <View style={styles.iconCircle}><Feather name="phone" size={20} color="#FDB913" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Call Us</Text>
                            <Text style={styles.infoText}>+91 123 456 7890</Text>
                            <Text style={styles.infoTextSmall}>Mon-Fri, 9am - 6pm</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.infoRow}>
                        <View style={styles.iconCircle}><Feather name="map-pin" size={20} color="#FDB913" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Visit Us</Text>
                            <Text style={styles.infoText}>123 Tech Park, Sector 5</Text>
                            <Text style={styles.infoText}>Bangalore, Karnataka 560001</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Send a Message</Text>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} placeholder="John" value={firstName} onChangeText={setFirstName} />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} placeholder="Doe" value={lastName} onChangeText={setLastName} />
                        </View>
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                    <Text style={styles.label}>Message</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="How can we help you?" value={message} onChangeText={setMessage} multiline numberOfLines={4} textAlignVertical="top" />

                    <TouchableOpacity style={styles.button} onPress={handleSend}>
                        <Text style={styles.buttonText}>Send Message</Text>
                        <Feather name="send" size={16} color="#000" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#282C3F', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 28, lineHeight: 22 },
    infoSection: { marginBottom: 28 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    infoLabel: { fontSize: 14, fontWeight: 'bold', color: '#282C3F', marginBottom: 2 },
    infoText: { fontSize: 13, color: '#555' },
    infoTextSmall: { fontSize: 12, color: '#888' },
    form: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE' },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#282C3F', marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#FAFAFA' },
    textArea: { height: 100 },
    button: { backgroundColor: '#FDB913', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 20 },
    buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
