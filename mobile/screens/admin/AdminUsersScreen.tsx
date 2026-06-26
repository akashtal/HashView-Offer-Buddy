import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/utils';
import Loading from '@/components/ui/Loading';

export default function AdminUsersScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { users, fetchUsers, deleteUser, updateUserRole, isLoading } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('user');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
        } else {
            fetchUsers();
        }
    }, [isAuthenticated, user, fetchUsers, router]);

    const filteredUsers = users.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${name}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(id);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const handleStartEdit = (userItem: any) => {
        setEditingUserId(userItem._id);
        setSelectedRole(userItem.role);
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleSaveRole = async (id: string) => {
        try {
            setIsSaving(true);
            await updateUserRole(id, selectedRole);
            setEditingUserId(null);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update role');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return <Loading fullScreen />;
    }

    if (isLoading && users.length === 0) {
        return <Loading fullScreen text="Loading users..." />;
    }

    const renderRolePickerOptions = (userId: string) => {
        const roles = ['user', 'vendor', 'admin'];
        return (
            <View style={styles.rolePickerBox}>
                {roles.map(r => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.roleOption, selectedRole === r && styles.roleOptionActive]}
                        onPress={() => setSelectedRole(r)}
                    >
                        <Text style={[styles.roleOptionText, selectedRole === r && styles.roleOptionTextActive]}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                        <Feather name="x" size={16} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveRole(userId)} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Feather name="check" size={16} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'admin': return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF', icon: 'shield' };
            case 'vendor': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: 'shopping-bag' };
            default: return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB', icon: 'user' };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const roleStyle = getRoleBadgeStyle(item.role);

        return (
            <View style={styles.userCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfoRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                        </View>
                    </View>

                    <View style={styles.statusBadge}>
                        <View style={[styles.dot, { backgroundColor: item.isVerified ? '#16A34A' : '#F59E0B' }]} />
                        <Text style={[styles.statusText, { color: item.isVerified ? '#16A34A' : '#F59E0B' }]}>
                            {item.isVerified ? 'Verified' : 'Pending'}
                        </Text>
                    </View>
                </View>

                {editingUserId === item._id ? (
                    renderRolePickerOptions(item._id)
                ) : (
                    <View style={styles.roleActionRow}>
                        <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                            <Feather name={roleStyle.icon as any} size={12} color={roleStyle.text} style={{ marginRight: 4 }} />
                            <Text style={[styles.roleText, { color: roleStyle.text }]}>
                                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                            </Text>
                        </View>

                        <View style={styles.detailTextCol}>
                            <Text style={styles.sinceText}>Joined {formatRelativeTime(item.createdAt)}</Text>
                        </View>

                        <View style={styles.actionsBox}>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleStartEdit(item)}>
                                <Feather name="edit-2" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id, item.name)}>
                                <Feather name="trash-2" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>User Management</Text>
                </View>

                <View style={styles.searchBox}>
                    <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearch}>
                            <Feather name="x" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.statsText}>
                    Showing {filteredUsers.length} of {users.length} users
                </Text>
            </View>

            <FlashList
                data={filteredUsers}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Feather name="users" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No users found {searchTerm && `matching "${searchTerm}"`}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 8 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    clearSearch: { padding: 4 },
    statsText: { fontSize: 12, color: '#6B7280' },

    listContent: { padding: 16, paddingBottom: 40 },

    userCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    userInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563' },
    userDetails: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    userEmail: { fontSize: 13, color: '#6B7280' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    statusText: { fontSize: 11, fontWeight: '500' },

    roleActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
    roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    roleText: { fontSize: 11, fontWeight: '600' },

    detailTextCol: { flex: 1, paddingHorizontal: 12 },
    sinceText: { fontSize: 11, color: '#9CA3AF' },

    actionsBox: { flexDirection: 'row', gap: 6 },
    iconBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },

    rolePickerBox: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
    roleOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF' },
    roleOptionActive: { backgroundColor: '#002B4E', borderColor: '#002B4E' },
    roleOptionText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    roleOptionTextActive: { color: '#FFF' },

    editActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
    cancelBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 6 },
    saveBtn: { padding: 6, backgroundColor: '#10B981', borderRadius: 6 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#6B7280', fontSize: 14, marginTop: 12 }
});
