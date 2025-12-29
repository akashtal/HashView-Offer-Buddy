'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { FiCheck, FiX, FiTrash2, FiMapPin, FiPhone, FiFilter } from 'react-icons/fi';
import Input from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminVendorsPage() {
    const { vendors, fetchVendors, approveVendor, rejectVendor, updateVendor, hardDeleteVendor, toggleVendorStatus, isLoading } = useAdminStore();
    const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
    const [editingVendor, setEditingVendor] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ shopName: '', shopDescription: '' });

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const filteredVendors = vendors.filter((v: any) => {
        if (filter === 'pending') return !v.isApproved;
        if (filter === 'active') return v.isApproved;
        return true;
    });

    const handleApprove = async (id: string) => {
        try {
            await approveVendor(id);
        } catch (e: any) { alert(e.message); }
    };

    const handleReject = async (id: string) => {
        if (!confirm('This will mark the vendor as rejected/inactive (Soft Delete). Continue?')) return;
        try {
            await rejectVendor(id); // Soft delete / reject
        } catch (e: any) { alert(e.message); }
    };

    const handleHardDelete = async (id: string) => {
        if (!confirm('WARNING: This will PERMANENTLY DELETE the vendor and all their products. This action cannot be undone. Continue?')) return;
        try {
            await hardDeleteVendor(id);
        } catch (e: any) { alert(e.message); }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toggleVendorStatus(id, !currentStatus);
        } catch (e: any) { alert(e.message); }
    };

    const handleEditStart = (vendor: any) => {
        setEditingVendor(vendor);
        setEditForm({ shopName: vendor.shopName, shopDescription: vendor.shopDescription || '' });
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateVendor(editingVendor._id, editForm);
            setEditingVendor(null);
        } catch (e: any) { alert(e.message); }
    };

    if (isLoading && vendors.length === 0) return <Loading fullScreen text="Loading vendors..." />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
                <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'active' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Pending
                    </button>
                </div>
            </div>

            <div className="grid gap-6">
                {filteredVendors.map((vendor: any) => (
                    <Card key={vendor._id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="p-6 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    {editingVendor?._id === vendor._id ? (
                                        <form onSubmit={handleEditSave} className="flex-1 space-y-2">
                                            <Input
                                                label="Shop Name"
                                                value={editForm.shopName}
                                                onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="Description"
                                                value={editForm.shopDescription}
                                                onChange={(e) => setEditForm({ ...editForm, shopDescription: e.target.value })}
                                            />
                                            <div className="flex gap-2 pt-2">
                                                <Button type="submit" size="sm">Save</Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingVendor(null)}>Cancel</Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold text-gray-900">{vendor.shopName}</h3>
                                                    <Badge variant={vendor.isActive ? (vendor.isApproved ? 'success' : 'warning') : 'danger'}>
                                                        {vendor.isActive ? (vendor.isApproved ? 'Active' : 'Pending Approval') : 'Suspended'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Joined {formatRelativeTime(vendor.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {!vendor.isApproved && vendor.isActive && (
                                                    <Button size="sm" onClick={() => handleApprove(vendor._id)}>
                                                        <FiCheck className="mr-2" /> Approve
                                                    </Button>
                                                )}

                                                <Button size="sm" variant="outline" onClick={() => handleEditStart(vendor)}>
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant={vendor.isActive ? 'warning' : 'success'}
                                                    onClick={() => handleToggleStatus(vendor._id, vendor.isActive)}
                                                >
                                                    {vendor.isActive ? 'Suspend' : 'Activate'}
                                                </Button>

                                                <Button size="sm" variant="danger" onClick={() => handleHardDelete(vendor._id)}>
                                                    <FiTrash2 className="mr-2" /> Delete
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!editingVendor || editingVendor._id !== vendor._id ? (
                                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div className="flex items-start gap-2">
                                            <FiMapPin className="mt-1 shrink-0 text-gray-400" />
                                            <span>
                                                {vendor.location?.address}, {vendor.location?.city}, {vendor.location?.state} - {vendor.location?.pincode}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiPhone className="text-gray-400" />
                                            <span>{vendor.contactInfo?.phone}</span>
                                        </div>
                                        <div className="md:col-span-2 bg-gray-50 p-3 rounded text-gray-700">
                                            <span className="font-semibold text-gray-900">Description: </span>
                                            {vendor.shopDescription || 'No description provided.'}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredVendors.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No vendors found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
