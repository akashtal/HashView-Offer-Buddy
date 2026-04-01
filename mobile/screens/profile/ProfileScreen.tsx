import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

// Design system components (will be converted to RN in components phase)
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, isAuthenticated, logout, updateProfile, isLoading } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '', phone: '',
        location: { address: '', city: '', state: '', country: 'India', pincode: '' }
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/(tabs)/signin');
        } else if (user) {
            setFormData({
                name: user.name || '', phone: user.phone || '',
                location: {
                    address: user.location?.address || '',
                    city: user.location?.city || '',
                    state: user.location?.state || '',
                    country: user.location?.country || 'India',
                    pincode: user.location?.pincode || '',
                }
            });
        }
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        await logout();
        router.replace('/(tabs)/signin');
    };

    const handleSave = async () => {
        setError(''); setSuccess('');
        try {
            await updateProfile({ name: formData.name, phone: formData.phone, location: formData.location });
            setSuccess('Profile updated successfully');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        }
    };

    if (!user) return <Loading fullScreen />;

    const roleBadgeColor = user.role === 'admin' ? '#1565C0' : user.role === 'vendor' ? '#6A1B9A' : '#2E7D32';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.topRow}>
                    <View>
                        <Text style={styles.title}>My Profile</Text>
                        <Text style={styles.subtitle}>Manage your account settings</Text>
                    </View>
                    {/* Button component for sign out */}
                    <Button variant="outline" onPress={handleLogout} style={styles.logoutBtn}>
                        <Feather name="log-out" size={14} color="#E53935" />
                        <Text style={styles.logoutText}> Sign Out</Text>
                    </Button>
                </View>

                {/* Avatar Card — uses Card component */}
                <Card style={styles.avatarCard}>
                    <CardBody>
                        <View style={styles.avatarInner}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor + '20' }]}>
                                <Feather name="shield" size={12} color={roleBadgeColor} />
                                <Text style={[styles.roleText, { color: roleBadgeColor }]}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </CardBody>
                </Card>

                {/* Details Card — uses Card component */}
                <Card>
                    <CardHeader>
                        <View style={styles.formHeader}>
                            <Text style={styles.sectionTitle}>User Details</Text>
                            <Button variant="ghost" size="sm" onPress={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </Button>
                        </View>
                    </CardHeader>
                    <CardBody>
                        {error !== '' && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
                        {success !== '' && <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>}

                        {/* Input components for consistent form design */}
                        <Input
                            label="Full Name"
                            value={isEditing ? formData.name : (user.name || '')}
                            onChangeText={(v: string) => setFormData({ ...formData, name: v })}
                            editable={isEditing}
                            icon={<Feather name="user" size={16} color="#888" />}
                        />
                        <Input
                            label="Phone Number"
                            value={isEditing ? formData.phone : (user.phone || 'Not provided')}
                            onChangeText={(v: string) => setFormData({ ...formData, phone: v })}
                            editable={isEditing}
                            keyboardType="phone-pad"
                            icon={<Feather name="phone" size={16} color="#888" />}
                        />
                        <Input
                            label="Email Address"
                            value={user.email || ''}
                            editable={false}
                            icon={<Feather name="mail" size={16} color="#888" />}
                        />

                        <View style={styles.divider} />
                        <Text style={styles.sectionSubtitle}>Address Details</Text>

                        <Input
                            label="Address"
                            value={isEditing ? formData.location.address : (user.location?.address || '')}
                            onChangeText={(v: string) => setFormData({ ...formData, location: { ...formData.location, address: v } })}
                            editable={isEditing}
                            placeholder="Street, Area"
                        />

                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Input label="City" value={isEditing ? formData.location.city : (user.location?.city || '')} onChangeText={(v: string) => setFormData({ ...formData, location: { ...formData.location, city: v } })} editable={isEditing} />
                            </View>
                            <View style={styles.half}>
                                <Input label="Pincode" value={isEditing ? formData.location.pincode : (user.location?.pincode || '')} onChangeText={(v: string) => setFormData({ ...formData, location: { ...formData.location, pincode: v } })} editable={isEditing} keyboardType="number-pad" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Input label="State" value={isEditing ? formData.location.state : (user.location?.state || '')} onChangeText={(v: string) => setFormData({ ...formData, location: { ...formData.location, state: v } })} editable={isEditing} />
                            </View>
                            <View style={styles.half}>
                                <Input label="Country" value={isEditing ? formData.location.country : (user.location?.country || 'India')} onChangeText={(v: string) => setFormData({ ...formData, location: { ...formData.location, country: v } })} editable={isEditing} />
                            </View>
                        </View>

                        {isEditing && (
                            <Button variant="primary" fullWidth onPress={handleSave} isLoading={isLoading}>
                                Save Changes
                            </Button>
                        )}
                    </CardBody>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { padding: 16, paddingBottom: 40 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#282C3F' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    avatarCard: { marginBottom: 16 },
    avatarInner: { alignItems: 'center', paddingVertical: 12 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FDB913' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#282C3F' },
    userEmail: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 8 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontSize: 12, fontWeight: '600' },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#282C3F' },
    sectionSubtitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 4 },
    errorBox: { backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10, marginBottom: 12 },
    errorText: { color: '#C62828', fontSize: 13 },
    successBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 12 },
    successText: { color: '#2E7D32', fontSize: 13 },
    divider: { borderTopWidth: 1, borderColor: '#EEE', marginVertical: 18 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    logoutBtn: { borderColor: '#E53935', flexDirection: 'row', alignItems: 'center' },
    logoutText: { color: '#E53935', fontWeight: '600', fontSize: 13 },
});
