'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { FiTrash2, FiSearch, FiShield, FiUser, FiShoppingBag, FiSave, FiX, FiCheck } from 'react-icons/fi';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminUsersPage() {
    const { users, fetchUsers, deleteUser, updateUserRole, isLoading } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('user');

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter((user: any) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await deleteUser(id);
        } catch (error: any) {
            alert(error.message || 'Failed to delete user');
        }
    };

    const handleStartEdit = (user: any) => {
        setEditingUserId(user._id);
        setSelectedRole(user.role);
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleSaveRole = async (id: string) => {
        try {
            await updateUserRole(id, selectedRole);
            setEditingUserId(null);
        } catch (error: any) {
            alert(error.message || 'Failed to update role');
        }
    };

    if (isLoading && users.length === 0) return <Loading fullScreen text="Loading users..." />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                    />
                </div>
            </div>

            <Card>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-gray-500 text-sm">
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Joined</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user: any) => (
                                    <tr key={user._id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold uppercase">
                                                    {user.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {editingUserId === user._id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={selectedRole}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                        className="border rounded px-2 py-1 text-sm focus:outline-primary"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="vendor">Vendor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                    ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        user.role === 'vendor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'}`
                                                }>
                                                    {user.role === 'admin' && <FiShield size={10} />}
                                                    {user.role === 'vendor' && <FiShoppingBag size={10} />}
                                                    {user.role === 'user' && <FiUser size={10} />}
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={user.isVerified ? 'success' : 'warning'}>
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {formatRelativeTime(user.createdAt)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {editingUserId === user._id ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit} title="Cancel">
                                                        <FiX />
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleSaveRole(user._id)} title="Save">
                                                        <FiCheck />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStartEdit(user)}
                                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                        title="Edit Role"
                                                    >
                                                        <FiShield />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                            No users found matching &quot;{searchTerm}&quot;
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
