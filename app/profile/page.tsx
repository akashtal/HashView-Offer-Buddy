'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { FiUser, FiMail, FiPhone, FiLogOut, FiEdit2, FiSave, FiX, FiMapPin, FiShield } from 'react-icons/fi';
import Loading from '@/components/ui/Loading';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, updateProfile, isLoading } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: {
            address: '',
            city: '',
            state: '',
            country: 'India',
            pincode: '',
        }
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user) {
            setFormData({
                name: user.name,
                phone: user.phone || '',
                location: {
                    address: user.location?.address || '',
                    city: user.location?.city || '',
                    state: user.location?.state || '',
                    country: user.location?.country || 'India',
                    pincode: user.location?.pincode || '',
                }
            });
        }
    }, [isAuthenticated, user, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await updateProfile({
                name: formData.name,
                phone: formData.phone,
                location: formData.location
            });
            setSuccess('Profile updated successfully');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        }
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value
            }
        }));
    };

    if (!user) return <Loading fullScreen />;

    return (
        <div className="min-h-screen bg-accent-light py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">My Profile</h1>
                        <p className="text-gray-600">Manage your account settings and preferences</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                        <FiLogOut className="mr-2" /> Sign Out
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Sidebar / User Info Card */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardBody className="text-center py-8">
                                <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-4xl font-bold text-primary mb-4">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-secondary">{user.name}</h2>
                                <p className="text-gray-500 mb-2">{user.email}</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    <FiShield className="mr-1" /> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex justify-between items-center border-b pb-4">
                                <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
                                    <FiUser /> User Details
                                </h3>
                                {!isEditing ? (
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                        <FiEdit2 className="mr-2" /> Edit Profile
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                        <FiX className="mr-2" /> Cancel
                                    </Button>
                                )}
                            </CardHeader>
                            <CardBody>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handleSave}>
                                    <div className="space-y-6">
                                        {/* Contact Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Information</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Full Name"
                                                    value={isEditing ? formData.name : user.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    disabled={!isEditing}
                                                    icon={<FiUser />}
                                                />
                                                <Input
                                                    label="Phone Number"
                                                    value={isEditing ? formData.phone : (user.phone || '')}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={!isEditing}
                                                    placeholder={!user.phone && !isEditing ? 'Not provided' : ''}
                                                    icon={<FiPhone />}
                                                />
                                                <div className="md:col-span-2">
                                                    <Input
                                                        label="Email Address"
                                                        value={user.email}
                                                        disabled
                                                        className="bg-gray-100 cursor-not-allowed"
                                                        icon={<FiMail />}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-6 space-y-4">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <FiMapPin /> Address Details
                                            </h4>

                                            <div className="space-y-4">
                                                <Input
                                                    name="address"
                                                    label="Address Line"
                                                    value={isEditing ? formData.location.address : (user.location?.address || '')}
                                                    onChange={handleLocationChange}
                                                    disabled={!isEditing}
                                                    placeholder={!user.location?.address && !isEditing ? 'Not provided' : 'Street, Area'}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input
                                                        name="city"
                                                        label="City"
                                                        value={isEditing ? formData.location.city : (user.location?.city || '')}
                                                        onChange={handleLocationChange}
                                                        disabled={!isEditing}
                                                        placeholder={!user.location?.city && !isEditing ? '-' : ''}
                                                    />
                                                    <Input
                                                        name="pincode"
                                                        label="Pincode"
                                                        value={isEditing ? formData.location.pincode : (user.location?.pincode || '')}
                                                        onChange={handleLocationChange}
                                                        disabled={!isEditing}
                                                        placeholder={!user.location?.pincode && !isEditing ? '-' : ''}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input
                                                        name="state"
                                                        label="State"
                                                        value={isEditing ? formData.location.state : (user.location?.state || '')}
                                                        onChange={handleLocationChange}
                                                        disabled={!isEditing}
                                                        placeholder={!user.location?.state && !isEditing ? '-' : ''}
                                                    />
                                                    <Input
                                                        name="country"
                                                        label="Country"
                                                        value={isEditing ? formData.location.country : (user.location?.country || 'India')}
                                                        onChange={handleLocationChange}
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="flex justify-end pt-4 border-t">
                                                <Button type="button" variant="ghost" className="mr-2" onClick={() => setIsEditing(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" variant="primary" isLoading={isLoading}>
                                                    <FiSave className="mr-2" /> Save Changes
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
