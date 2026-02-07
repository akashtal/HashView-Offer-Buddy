'use client';

import { useEffect, useState } from 'react';
import { getVendorsWithKYC, approveKYC, rejectKYC } from './actions';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { FiCheck, FiX, FiFileText, FiExternalLink, FiFilter } from 'react-icons/fi';

type KYCFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface Store {
    _id: string;
    shopName: string;
    vendorId?: { name?: string; email?: string; phone?: string };
    category?: { name?: string };
    kycDocuments?: {
        idProof?: { url: string; type: string; uploadedAt: string };
        businessDocument?: { url: string; type: string; uploadedAt: string };
        status: string;
        reviewedAt?: string;
        rejectionReason?: string;
    };
    createdAt: string;
}

export default function AdminKYCPage() {
    const [vendors, setVendors] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<KYCFilter>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ storeId: string; shopName: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const data = await getVendorsWithKYC(filter);
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVendors();
    }, [filter]);

    const handleApprove = async (storeId: string) => {
        if (!confirm('Approve this vendor\'s KYC documents?')) return;
        setActionLoading(storeId);
        try {
            await approveKYC(storeId);
            await loadVendors();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectModal || !rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        setActionLoading(rejectModal.storeId);
        try {
            await rejectKYC(rejectModal.storeId, rejectReason);
            setRejectModal(null);
            setRejectReason('');
            await loadVendors();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const getDocTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            aadhaar: 'Aadhaar Card',
            pan: 'PAN Card',
            voter_id: 'Voter ID',
            passport: 'Passport',
            gst_certificate: 'GST Certificate',
            trade_license: 'Trade License',
            udyam: 'Udyam Registration',
            other: 'Other Document',
        };
        return labels[type] || type;
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'approved':
                return <Badge variant="success">Approved</Badge>;
            case 'rejected':
                return <Badge variant="danger">Rejected</Badge>;
            case 'pending':
                return <Badge variant="warning">Pending</Badge>;
            default:
                return <Badge variant="info">Not Submitted</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
                    <p className="text-gray-500">Review and verify vendor KYC documents</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-3">
                {(['pending', 'all', 'approved', 'rejected'] as KYCFilter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${filter === f
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <Loading />
            ) : vendors.length === 0 ? (
                <Card>
                    <CardBody>
                        <div className="text-center py-12">
                            <FiFileText className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-gray-700">No vendors found</h3>
                            <p className="text-gray-500">No vendors match the selected filter</p>
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {vendors.map((vendor) => (
                        <Card key={vendor._id}>
                            <CardBody>
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    {/* Vendor Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{vendor.shopName}</h3>
                                            {getStatusBadge(vendor.kycDocuments?.status)}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            {vendor.vendorId?.name && <p>Owner: {vendor.vendorId.name}</p>}
                                            {vendor.vendorId?.email && <p>Email: {vendor.vendorId.email}</p>}
                                            {vendor.vendorId?.phone && <p>Phone: {vendor.vendorId.phone}</p>}
                                            {vendor.category?.name && <p>Category: {vendor.category.name}</p>}
                                        </div>
                                    </div>

                                    {/* KYC Documents */}
                                    <div className="flex-1 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-700">Documents</h4>

                                        {vendor.kycDocuments?.idProof?.url ? (
                                            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                <FiFileText className="text-blue-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">ID Proof</p>
                                                    <p className="text-xs text-gray-500">
                                                        {getDocTypeLabel(vendor.kycDocuments.idProof.type)}
                                                    </p>
                                                </div>
                                                <a
                                                    href={vendor.kycDocuments.idProof.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                >
                                                    View <FiExternalLink size={14} />
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No ID proof uploaded</p>
                                        )}

                                        {vendor.kycDocuments?.businessDocument?.url ? (
                                            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                <FiFileText className="text-green-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Business Document</p>
                                                    <p className="text-xs text-gray-500">
                                                        {getDocTypeLabel(vendor.kycDocuments.businessDocument.type)}
                                                    </p>
                                                </div>
                                                <a
                                                    href={vendor.kycDocuments.businessDocument.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                >
                                                    View <FiExternalLink size={14} />
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No business document uploaded</p>
                                        )}

                                        {vendor.kycDocuments?.rejectionReason && (
                                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700">
                                                    <strong>Rejection Reason:</strong> {vendor.kycDocuments.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {vendor.kycDocuments?.status === 'pending' && (
                                        <div className="flex gap-2 lg:flex-col">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleApprove(vendor._id)}
                                                isLoading={actionLoading === vendor._id}
                                            >
                                                <FiCheck className="mr-1" /> Approve
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => setRejectModal({ storeId: vendor._id, shopName: vendor.shopName })}
                                                disabled={actionLoading === vendor._id}
                                            >
                                                <FiX className="mr-1" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-2">Reject KYC</h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejecting <strong>{rejectModal.shopName}</strong>&apos;s KYC documents.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setRejectModal(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRejectConfirm}
                                isLoading={actionLoading === rejectModal.storeId}
                            >
                                Confirm Reject
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
